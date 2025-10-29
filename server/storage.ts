import { type User, type InsertUser, type AuthorizedNumber, type InsertAuthorizedNumber, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";
import { getPool } from "./db";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllAuthorizedNumbers(): Promise<AuthorizedNumber[]>;
  getAuthorizedNumberByPhone(phone: string): Promise<AuthorizedNumber | undefined>;
  createAuthorizedNumber(number: InsertAuthorizedNumber): Promise<AuthorizedNumber>;
  deleteAuthorizedNumber(id: string): Promise<boolean>;
  
  getAllMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private authorizedNumbers: Map<string, AuthorizedNumber>;
  private messages: Map<string, Message>;

  constructor() {
    this.users = new Map();
    this.authorizedNumbers = new Map();
    this.messages = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllAuthorizedNumbers(): Promise<AuthorizedNumber[]> {
    return Array.from(this.authorizedNumbers.values());
  }

  async getAuthorizedNumberByPhone(phone: string): Promise<AuthorizedNumber | undefined> {
    return Array.from(this.authorizedNumbers.values()).find(
      (number) => number.phone === phone,
    );
  }

  async createAuthorizedNumber(insertNumber: InsertAuthorizedNumber): Promise<AuthorizedNumber> {
    const id = randomUUID();
    const number: AuthorizedNumber = {
      ...insertNumber,
      id,
      dateAdded: new Date(),
    };
    this.authorizedNumbers.set(id, number);
    return number;
  }

  async deleteAuthorizedNumber(id: string): Promise<boolean> {
    return this.authorizedNumbers.delete(id);
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }
}

export class SqlServerStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('SELECT * FROM users WHERE id = @id');
    return result.recordset[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input('username', username)
      .query('SELECT * FROM users WHERE username = @username');
    return result.recordset[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const pool = await getPool();
    const id = randomUUID();
    await pool.request()
      .input('id', id)
      .input('username', insertUser.username)
      .input('password', insertUser.password)
      .query('INSERT INTO users (id, username, password) VALUES (@id, @username, @password)');
    return { id, ...insertUser };
  }

  async getAllAuthorizedNumbers(): Promise<AuthorizedNumber[]> {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM authorized_numbers ORDER BY date_added DESC');
    return result.recordset.map((row: any) => ({
      id: row.id,
      phone: row.phone,
      label: row.label,
      dateAdded: new Date(row.date_added),
    }));
  }

  async getAuthorizedNumberByPhone(phone: string): Promise<AuthorizedNumber | undefined> {
    const pool = await getPool();
    const result = await pool.request()
      .input('phone', phone)
      .query('SELECT * FROM authorized_numbers WHERE phone = @phone');
    
    if (result.recordset.length === 0) return undefined;
    
    const row = result.recordset[0];
    return {
      id: row.id,
      phone: row.phone,
      label: row.label,
      dateAdded: new Date(row.date_added),
    };
  }

  async createAuthorizedNumber(insertNumber: InsertAuthorizedNumber): Promise<AuthorizedNumber> {
    const pool = await getPool();
    const id = randomUUID();
    const dateAdded = new Date();
    
    await pool.request()
      .input('id', id)
      .input('phone', insertNumber.phone)
      .input('label', insertNumber.label)
      .query('INSERT INTO authorized_numbers (id, phone, label) VALUES (@id, @phone, @label)');
    
    return {
      id,
      phone: insertNumber.phone,
      label: insertNumber.label,
      dateAdded,
    };
  }

  async deleteAuthorizedNumber(id: string): Promise<boolean> {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', id)
      .query('DELETE FROM authorized_numbers WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  async getAllMessages(): Promise<Message[]> {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM messages ORDER BY timestamp DESC');
    return result.recordset.map((row: any) => ({
      id: row.id,
      phone: row.phone,
      content: row.content,
      direction: row.direction,
      timestamp: new Date(row.timestamp),
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const pool = await getPool();
    const id = randomUUID();
    const timestamp = new Date();
    
    await pool.request()
      .input('id', id)
      .input('phone', insertMessage.phone)
      .input('content', insertMessage.content)
      .input('direction', insertMessage.direction)
      .query('INSERT INTO messages (id, phone, content, direction) VALUES (@id, @phone, @content, @direction)');
    
    return {
      id,
      phone: insertMessage.phone,
      content: insertMessage.content,
      direction: insertMessage.direction,
      timestamp,
    };
  }
}

async function initializeStorage(): Promise<IStorage> {
  const shouldUseSqlServer = process.env.DB_HOST && process.env.DB_NAME;
  
  if (shouldUseSqlServer) {
    try {
      const testStorage = new SqlServerStorage();
      await testStorage.getAllAuthorizedNumbers();
      console.log('✓ Usando SQL Server para armazenamento');
      return testStorage;
    } catch (error) {
      console.log('⚠ SQL Server não disponível, usando armazenamento em memória');
      return new MemStorage();
    }
  }
  
  console.log('✓ Usando armazenamento em memória');
  return new MemStorage();
}

let storageInstance: IStorage | null = null;

export async function getStorage(): Promise<IStorage> {
  if (!storageInstance) {
    storageInstance = await initializeStorage();
  }
  return storageInstance;
}

export const storage = new MemStorage();
