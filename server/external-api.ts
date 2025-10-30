
import { getStorage } from "./storage";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ApiResponse {
  DataSet: {
    Table: any[];
  };
  Query: string;
}

class ExternalApiService {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  async getToken(): Promise<string> {
    // Se o token ainda é válido, retorna o token existente
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // Busca as configurações do sistema
    const storage = await getStorage();
    const settings = await storage.getSettings();

    if (!settings) {
      throw new Error("Configurações não encontradas");
    }

    // Faz a requisição para obter o token
    const formData = new URLSearchParams();
    formData.append('username', settings.username);
    formData.append('password', settings.password);
    formData.append('company', settings.company);
    formData.append('instance', settings.instance);
    formData.append('line', settings.line);
    formData.append('grant_type', settings.grantType);

    const response = await fetch(`${settings.url}/WebApi/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter token: ${response.status}`);
    }

    const data: TokenResponse = await response.json();
    
    // Armazena o token e calcula o tempo de expiração (com margem de segurança de 60 segundos)
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return this.token;
  }

  async callApi(endpoint: string): Promise<ApiResponse> {
    const token = await this.getToken();
    const storage = await getStorage();
    const settings = await storage.getSettings();

    if (!settings) {
      throw new Error("Configurações não encontradas");
    }

    const response = await fetch(`${settings.url}/WebApi/${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      // Se o token expirou, limpa e tenta novamente
      if (response.status === 401) {
        this.token = null;
        this.tokenExpiry = 0;
        return this.callApi(endpoint);
      }
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  }

  async getTop5VendasHoje(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/Top5VendasPrecHoje?serie=${encodeURIComponent(serie)}`
      : 'GetDados/Top5VendasPrecHoje';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }

  async getTop5VendasSemana(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/Top5VendasPrecSemana?serie=${encodeURIComponent(serie)}`
      : 'GetDados/Top5VendasPrecSemana';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }

  async getTop5VendasMes(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/Top5VendasPrecMes?serie=${encodeURIComponent(serie)}`
      : 'GetDados/Top5VendasPrecMes';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }

  async getVendasHoje(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/VendasPrecHoje?serie=${encodeURIComponent(serie)}`
      : 'GetDados/VendasPrecHoje';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }

  async getVendasSemana(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/VendasPrecSemana?serie=${encodeURIComponent(serie)}`
      : 'GetDados/VendasPrecSemana';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }

  async getVendasMes(serie?: string | null): Promise<any[]> {
    const endpoint = serie 
      ? `GetDados/VendasPrecMes?serie=${encodeURIComponent(serie)}`
      : 'GetDados/VendasPrecMes';
    const response = await this.callApi(endpoint);
    return response.DataSet.Table || [];
  }
}

export const externalApiService = new ExternalApiService();
