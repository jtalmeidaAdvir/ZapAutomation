import { type User, type InsertUser, type AuthorizedNumber, type InsertAuthorizedNumber, type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
