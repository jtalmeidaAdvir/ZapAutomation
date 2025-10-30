import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
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

  whatsappClient.on("message", async (message: any) => {
    try {
      const contact = await message.getContact();
      const phoneNumber = contact.number;

      console.log(`Mensagem recebida de ${phoneNumber}: ${message.body}`);

      // Se o número está autorizado, processa a mensagem
      const storage = await getStorage();
      let responseText = "";

      // Processa comandos específicos
      const messageText = message.body.toLowerCase().trim();

      if (messageText.includes("top 5") && messageText.includes("vendas")) {
        try {
          const vendas = await externalApiService.getTop5VendasHoje();

          if (vendas.length === 0) {
            responseText = "Não há vendas registradas hoje.";
          } else {
            responseText = "🏆 Top 5 Vendas de Hoje:\n\n";
            vendas.slice(0, 5).forEach((venda: any, index: number) => {
              responseText += `${index + 1}. ${JSON.stringify(venda)}\n`;
            });
          }
        } catch (error) {
          console.error("Erro ao buscar top 5 vendas:", error);
          responseText = "Desculpe, ocorreu um erro ao buscar as vendas. Por favor, tente novamente mais tarde.";
        }
      } else {
        responseText = `Olá! Recebi sua mensagem: "${message.body}"\n\nComandos disponíveis:\n- "top 5 vendas" - Ver o top 5 de vendas de hoje`;
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
    socket.emit("error", "Não foi possível inicializar o WhatsApp. O ambiente Replit pode não suportar o Puppeteer necessário para o WhatsApp Web.js.");
    whatsappClient = null;
  }
}

export function getWhatsAppClient() {
  return whatsappClient;
}

export function getSocketIO() {
  return io;
}