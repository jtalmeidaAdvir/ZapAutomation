import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getStorage } from "./storage";
import { externalApiService } from "./external-api";

let whatsappClient: InstanceType<typeof Client> | null = null;
let io: SocketIOServer | null = null;

export function initializeWhatsApp(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Cliente conectado via WebSocket");

    socket.on("initialize-whatsapp", async () => {
      if (whatsappClient) {
        const state = await whatsappClient.getState();
        if (state === "CONNECTED") {
          socket.emit("whatsapp-ready");
          return;
        }
      }

      startWhatsAppClient(socket);
    });

    socket.on("disconnect", () => {
      console.log("Cliente desconectado do WebSocket");
    });
  });

  return io;
}

async function startWhatsAppClient(socket: any): Promise<void> {
  try {
    if (whatsappClient) {
      whatsappClient.destroy();
    }

    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: ".wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
      },
    });

    whatsappClient.on("qr", async (qr: string) => {
      console.log("QR Code recebido, gerando imagem...");
      try {
        const qrImage = await QRCode.toDataURL(qr);
        socket.emit("qr-code", qrImage);
        if (io) {
          io.emit("qr-code", qrImage);
        }
      } catch (err) {
        console.error("Erro ao gerar QR code:", err);
        socket.emit("error", "Erro ao gerar QR code");
      }
    });

    whatsappClient.on("ready", () => {
      console.log("WhatsApp conectado e pronto!");
      socket.emit("whatsapp-ready");
      if (io) {
        io.emit("whatsapp-ready");
      }
    });

    whatsappClient.on("authenticated", () => {
      console.log("WhatsApp autenticado com sucesso!");
      socket.emit("whatsapp-authenticated");
    });

    whatsappClient.on("auth_failure", (msg: string) => {
      console.error("Falha na autenticação:", msg);
      socket.emit("error", "Falha na autenticação do WhatsApp");
    });

    whatsappClient.on("disconnected", (reason: string) => {
      console.log("WhatsApp desconectado:", reason);
      socket.emit("whatsapp-disconnected");
      if (io) {
        io.emit("whatsapp-disconnected");
      }
    });

    // Armazena o estado da conversa de cada usuário
    const userStates = new Map<string, { step: string; data?: any }>();

    whatsappClient.on("message", async (message: any) => {
      try {
        const contact = await message.getContact();
        const phoneNumber = contact.number;

        console.log(`Mensagem recebida de ${phoneNumber}: ${message.body}`);

        const storage = await getStorage();
        let responseText = "";

        const messageText = message.body.trim();
        const userState = userStates.get(phoneNumber);

        // Menu principal
        if (!userState || userState.step === "main") {
          if (messageText === "1") {
            // Usuário escolheu Vendas
            userStates.set(phoneNumber, { step: "vendas_globais_loja" });
            responseText = `💰 *Vendas*\n\n1. Por Loja/Serie\n2. Todas as Lojas`;
          } else if (messageText === "2") {
            // Usuário escolheu Top 5 Vendas
            userStates.set(phoneNumber, { step: "vendas_loja" });
            responseText = `📊 *Top 5 Vendas*\n\n1. Por Loja/Serie\n2. Todas as Lojas`;
          } else {
            // Mostra menu principal
            userStates.set(phoneNumber, { step: "main" });
            responseText = `Olá! Bem-vindo ao sistema de automação.\n\n*Menu Principal:*\n\n1. Vendas\n2. Top 5 Vendas\n\nDigite o número da opção desejada.`;
          }
        }
        // Pergunta se quer filtrar por loja (Vendas Globais)
        else if (userState.step === "vendas_globais_loja") {
          if (messageText === "1") {
            // Usuário quer filtrar por série
            userStates.set(phoneNumber, { step: "vendas_globais_serie_input" });
            responseText = `Digite o número da série/loja:`;
          } else if (messageText === "2") {
            // Não quer filtrar, vai direto para escolha de período
            userStates.set(phoneNumber, {
              step: "vendas_globais_periodo",
              data: { serie: null },
            });
            responseText = `💰 *Vendas*\n\nEscolha o período:\n\n1. Hoje\n2. Ultimos 7 dias\n3. Mês`;
          } else {
            responseText = `Opção inválida. Por favor, escolha:\n\n1. Sim\n2. Não (todas as lojas)`;
          }
        }
        // Input da série (Vendas Globais)
        else if (userState.step === "vendas_globais_serie_input") {
          const serie = messageText.trim();
          userStates.set(phoneNumber, {
            step: "vendas_globais_periodo",
            data: { serie },
          });
          responseText = `💰 *Vendas - Série ${serie}*\n\nEscolha o período:\n\n1. Hoje\n2. Ultimos 7 dias\n3. Mês`;
        }
        // Submenu de Vendas Globais
        else if (userState.step === "vendas_globais_periodo") {
          if (messageText === "1") {
            // Vendas de Hoje
            try {
              const serie = userState.data?.serie || null;
              const vendas = await externalApiService.getVendasHoje(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas hoje para a série ${serie}.`
                  : "Não há vendas registradas hoje.";
              } else {
                responseText = serie
                  ? `💰 *Vendas de Hoje - Série ${serie}:*\n\n`
                  : "💰 *Vendas de Hoje:*\n\n";
                let total = 0;
                vendas.forEach((venda: any) => {
                  responseText += `${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc} - €${parseFloat(venda.TotalMerc).toFixed(2)}\n`;
                  total += parseFloat(venda.TotalMerc);
                });
                responseText += `\n*Total: €${total.toFixed(2)}*`;
              }
            } catch (error) {
              console.error("Erro ao buscar vendas hoje:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "\n---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else if (messageText === "2") {
            // Vendas da Semana
            try {
              const serie = userState.data?.serie || null;
              const vendas = await externalApiService.getVendasSemana(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas esta semana para a série ${serie}.`
                  : "Não há vendas registradas esta semana.";
              } else {
                responseText = serie
                  ? `💰 *Vendas da Semana - Série ${serie}:*\n\n`
                  : "💰 *Vendas da Semana:*\n\n";
                let total = 0;
                vendas.forEach((venda: any) => {
                  responseText += `${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc} - €${parseFloat(venda.TotalMerc).toFixed(2)}\n`;
                  total += parseFloat(venda.TotalMerc);
                });
                responseText += `\n*Total: €${total.toFixed(2)}*`;
              }
            } catch (error) {
              console.error("Erro ao buscar vendas semana:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "\n---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else if (messageText === "3") {
            // Vendas do Mês
            try {
              const serie = userState.data?.serie || null;
              const vendas = await externalApiService.getVendasMes(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas este mês para a série ${serie}.`
                  : "Não há vendas registradas este mês.";
              } else {
                responseText = serie
                  ? `💰 *Vendas do Mês - Série ${serie}:*\n\n`
                  : "💰 *Vendas do Mês:*\n\n";
                let total = 0;
                vendas.forEach((venda: any) => {
                  responseText += `${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc} - €${parseFloat(venda.TotalMerc).toFixed(2)}\n`;
                  total += parseFloat(venda.TotalMerc);
                });
                responseText += `\n*Total: €${total.toFixed(2)}*`;
              }
            } catch (error) {
              console.error("Erro ao buscar vendas mês:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "\n---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else {
            // Opção inválida
            responseText = `Opção inválida. Por favor, escolha:\n\n1. Hoje\n2. Semana\n3. Mês`;
          }
        }
        // Pergunta se quer filtrar por loja (Top 5)
        else if (userState.step === "vendas_loja") {
          if (messageText === "1") {
            // Usuário quer filtrar por série
            userStates.set(phoneNumber, { step: "vendas_serie_input" });
            responseText = `Digite o número da série/loja:`;
          } else if (messageText === "2") {
            // Não quer filtrar, vai direto para escolha de período
            userStates.set(phoneNumber, {
              step: "vendas_periodo",
              data: { serie: null },
            });
            responseText = `📊 *Top 5 Vendas*\n\nEscolha o período:\n\n1. Hoje\n2. Ultimos 7 dias\n3. Mês`;
          } else {
            responseText = `Opção inválida. Por favor, escolha:\n\n1. Sim\n2. Não (todas as lojas)`;
          }
        }
        // Input da série
        else if (userState.step === "vendas_serie_input") {
          const serie = messageText.trim();
          userStates.set(phoneNumber, {
            step: "vendas_periodo",
            data: { serie },
          });
          responseText = `📊 *Top 5 Vendas - Série ${serie}*\n\nEscolha o período:\n\n1. Hoje\n2. Ultimos 7 dias\n3. Mês`;
        }
        // Submenu de Top 5 Vendas
        else if (userState.step === "vendas_periodo") {
          if (messageText === "1") {
            // Top 5 Vendas de Hoje
            try {
              const serie = userState.data?.serie || null;
              const vendas = await externalApiService.getTop5VendasHoje(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas hoje para a série ${serie}.`
                  : "Não há vendas registradas hoje.";
              } else {
                responseText = serie
                  ? `🏆 *Top 5 Vendas de Hoje - Série ${serie}:*\n\n`
                  : "🏆 *Top 5 Vendas de Hoje:*\n\n";
                vendas.slice(0, 5).forEach((venda: any, index: number) => {
                  responseText += `*${index + 1}.* ${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc}\n`;
                  responseText += `   💰 Total: €${parseFloat(venda.TotalMerc).toFixed(2)}\n\n`;
                });
              }
            } catch (error) {
              console.error("Erro ao buscar top 5 vendas hoje:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else if (messageText === "2") {
            // Top 5 Vendas da Semana
            try {
              const serie = userState.data?.serie || null;
              const vendas =
                await externalApiService.getTop5VendasSemana(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas esta semana para a série ${serie}.`
                  : "Não há vendas registradas esta semana.";
              } else {
                responseText = serie
                  ? `🏆 *Top 5 Vendas da Semana - Série ${serie}:*\n\n`
                  : "🏆 *Top 5 Vendas da Semana:*\n\n";
                vendas.slice(0, 5).forEach((venda: any, index: number) => {
                  responseText += `*${index + 1}.* ${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc}\n`;
                  responseText += `   💰 Total: €${parseFloat(venda.TotalMerc).toFixed(2)}\n\n`;
                });
              }
            } catch (error) {
              console.error("Erro ao buscar top 5 vendas semana:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else if (messageText === "3") {
            // Top 5 Vendas do Mês
            try {
              const serie = userState.data?.serie || null;
              const vendas = await externalApiService.getTop5VendasMes(serie);

              if (vendas.length === 0) {
                responseText = serie
                  ? `Não há vendas registradas este mês para a série ${serie}.`
                  : "Não há vendas registradas este mês.";
              } else {
                responseText = serie
                  ? `🏆 *Top 5 Vendas do Mês - Série ${serie}:*\n\n`
                  : "🏆 *Top 5 Vendas do Mês:*\n\n";
                vendas.slice(0, 5).forEach((venda: any, index: number) => {
                  responseText += `*${index + 1}.* ${venda.TipoDoc} ${venda.Serie}/${venda.NumDoc}\n`;
                  responseText += `   💰 Total: €${parseFloat(venda.TotalMerc).toFixed(2)}\n\n`;
                });
              }
            } catch (error) {
              console.error("Erro ao buscar top 5 vendas mês:", error);
              responseText =
                "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
            }
            userStates.set(phoneNumber, { step: "main" });
            responseText +=
              "---\nDigite qualquer mensagem para voltar ao menu principal.";
          } else {
            // Opção inválida
            responseText = `Opção inválida. Por favor, escolha:\n\n1. Hoje\n2. Semana\n3. Mês`;
          }
        }

        await message.reply(responseText);

        // Armazena a mensagem recebida
        await storage.createMessage({
          phone: phoneNumber,
          content: message.body,
          direction: "received",
        });

        // Armazena a resposta enviada
        await storage.createMessage({
          phone: phoneNumber,
          content: responseText,
          direction: "sent",
        });

        // Notifica o frontend sobre as novas mensagens
        if (io) {
          io.emit("new-message");
        }
      } catch (error) {
        console.error("Erro ao processar mensagem:", error);
      }
    });

    await whatsappClient.initialize();
  } catch (error) {
    console.error("Erro ao inicializar WhatsApp:", error);
    socket.emit(
      "error",
      "Não foi possível inicializar o WhatsApp. O ambiente Replit pode não suportar o Puppeteer necessário para o WhatsApp Web.js.",
    );
    whatsappClient = null;
  }
}

export function getWhatsAppClient() {
  return whatsappClient;
}

export function getSocketIO() {
  return io;
}
