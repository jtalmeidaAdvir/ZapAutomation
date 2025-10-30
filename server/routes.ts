import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertAuthorizedNumberSchema, insertUserSchema, insertSettingsSchema } from "@shared/schema";
import { initializeWhatsApp } from "./whatsapp";
import { authMiddleware, generateToken, type AuthRequest } from "./middleware/auth";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  initializeWhatsApp(httpServer);

  // Rotas de autenticação (públicas)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Dados inválidos", details: result.error });
      }

      const storage = await getStorage();
      const existingUser = await storage.getUserByUsername(result.data.username);
      
      if (existingUser) {
        return res.status(409).json({ error: "Usuário já existe" });
      }

      const hashedPassword = await bcrypt.hash(result.data.password, 10);
      const user = await storage.createUser({
        username: result.data.username,
        password: hashedPassword,
      });

      const token = generateToken(user.id);
      res.status(201).json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username 
        } 
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({ error: "Erro ao registrar usuário" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username e senha são obrigatórios" });
      }

      const storage = await getStorage();
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const token = generateToken(user.id);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username 
        } 
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const storage = await getStorage();
      const user = await storage.getUser(req.userId!);

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ 
        id: user.id, 
        username: user.username 
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  });

  // Rotas protegidas - requerem autenticação
  app.get("/api/authorized-numbers", authMiddleware, async (req, res) => {
    try {
      const storage = await getStorage();
      const numbers = await storage.getAllAuthorizedNumbers();
      res.json(numbers);
    } catch (error) {
      console.error("Erro ao buscar números autorizados:", error);
      res.status(500).json({ error: "Erro ao buscar números autorizados" });
    }
  });

  app.post("/api/authorized-numbers", authMiddleware, async (req, res) => {
    try {
      const result = insertAuthorizedNumberSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Dados inválidos", details: result.error });
      }

      const storage = await getStorage();
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

  app.delete("/api/authorized-numbers/:id", authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const storage = await getStorage();
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

  app.get("/api/messages", authMiddleware, async (req, res) => {
    try {
      const storage = await getStorage();
      const messages = await storage.getAllMessages();
      res.json(messages);
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
  });

  app.get("/api/settings", authMiddleware, async (req, res) => {
    try {
      const storage = await getStorage();
      const settings = await storage.getSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  });

  app.post("/api/settings", authMiddleware, async (req, res) => {
    try {
      const result = insertSettingsSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: "Dados inválidos", details: result.error });
      }

      const storage = await getStorage();
      const settings = await storage.upsertSettings(result.data);
      res.json(settings);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      res.status(500).json({ error: "Erro ao salvar configurações" });
    }
  });

  return httpServer;
}
