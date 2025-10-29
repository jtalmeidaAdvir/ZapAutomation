import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAuthorizedNumberSchema } from "@shared/schema";
import { initializeWhatsApp } from "./whatsapp";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  initializeWhatsApp(httpServer);

  app.get("/api/authorized-numbers", async (req, res) => {
    try {
      const numbers = await storage.getAllAuthorizedNumbers();
      res.json(numbers);
    } catch (error) {
      console.error("Erro ao buscar números autorizados:", error);
      res.status(500).json({ error: "Erro ao buscar números autorizados" });
    }
  });

  app.post("/api/authorized-numbers", async (req, res) => {
    try {
      const result = insertAuthorizedNumberSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Dados inválidos", details: result.error });
      }

      const existingNumber = await storage.getAuthorizedNumberByPhone(result.data.phone);
      if (existingNumber) {
        return res.status(409).json({ error: "Número já está autorizado" });
      }

      const number = await storage.createAuthorizedNumber(result.data);
      res.status(201).json(number);
    } catch (error) {
      console.error("Erro ao adicionar número autorizado:", error);
      res.status(500).json({ error: "Erro ao adicionar número autorizado" });
    }
  });

  app.delete("/api/authorized-numbers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAuthorizedNumber(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Número não encontrado" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar número autorizado:", error);
      res.status(500).json({ error: "Erro ao deletar número autorizado" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  });

  return httpServer;
}
