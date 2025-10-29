import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;
import QRCode from "qrcode";
import type { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";

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

function startWhatsAppClient(socket: any): void {
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

      await storage.createMessage({
        phone: phoneNumber,
        content: message.body,
        direction: "received",
      });

      if (io) {
        io.emit("new-message", {
          phone: phoneNumber,
          content: message.body,
          direction: "received",
          timestamp: new Date(),
        });
      }

      const authorizedNumber = await storage.getAuthorizedNumberByPhone(phoneNumber);

      if (authorizedNumber) {
        const responseText = `Obrigado pela sua mensagem! Esta é uma resposta automática. Em breve entraremos em contato.`;
        
        await message.reply(responseText);

        await storage.createMessage({
          phone: phoneNumber,
          content: responseText,
          direction: "sent",
        });

        if (io) {
          io.emit("new-message", {
            phone: phoneNumber,
            content: responseText,
            direction: "sent",
            timestamp: new Date(),
          });
        }

        console.log(`Resposta automática enviada para ${phoneNumber}`);
      } else {
        console.log(`Número ${phoneNumber} não autorizado - mensagem ignorada`);
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  whatsappClient.initialize();
}

export function getWhatsAppClient() {
  return whatsappClient;
}

export function getSocketIO() {
  return io;
}
