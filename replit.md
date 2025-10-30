# WhatsApp Automação - Sistema de Respostas Automáticas

## Visão Geral

Aplicação fullstack para conectar um número ao WhatsApp Web e enviar respostas automáticas apenas para números autorizados. Utiliza whatsapp-web.js (versão gratuita) para integração com WhatsApp.

## Tecnologias

### Backend
- **Node.js** com Express
- **whatsapp-web.js** - Integração com WhatsApp Web
- **Socket.IO** - Comunicação em tempo real para QR code e mensagens
- **JWT (jsonwebtoken)** - Autenticação de usuários
- **bcryptjs** - Hash de senhas
- **In-memory storage** - Armazenamento de números autorizados e mensagens
- **SQL Server (opcional)** - Suporte para armazenamento persistente com mssql

### Frontend
- **React** com TypeScript
- **Shadcn UI** - Componentes de interface
- **TanStack Query** - Gerenciamento de estado e cache
- **Socket.IO Client** - Conexão WebSocket com backend
- **Tailwind CSS** - Estilização
- **AuthContext** - Gerenciamento de autenticação no frontend

## Estrutura do Projeto

```
├── client/                      # Frontend React
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   │   ├── ProtectedRoute.tsx  # Proteção de rotas autenticadas
│   │   │   └── ...
│   │   ├── hooks/               # Custom hooks (useWhatsApp)
│   │   ├── pages/               # Páginas da aplicação
│   │   │   ├── Dashboard.tsx    # Página principal
│   │   │   ├── Settings.tsx     # Página de configurações
│   │   │   └── login.tsx        # Página de login/registro
│   │   └── lib/                 # Utilitários
│   │       ├── auth.tsx         # Contexto de autenticação
│   │       └── queryClient.ts   # Cliente React Query com JWT
├── server/                      # Backend Node.js
│   ├── middleware/
│   │   └── auth.ts              # Middleware JWT
│   ├── routes.ts                # Rotas da API REST + autenticação
│   ├── storage.ts               # Interface de armazenamento (MemStorage + SQL Server)
│   ├── db.ts                    # Conexão SQL Server
│   ├── whatsapp.ts              # Serviço WhatsApp + Socket.IO
│   └── index.ts                 # Servidor principal
└── shared/                      # Tipos compartilhados
    └── schema.ts                # Schemas Zod e tipos TypeScript
```

## Funcionalidades Implementadas

### ✅ Autenticação JWT
- Sistema de registro e login de usuários
- Autenticação via JSON Web Tokens (JWT)
- Middleware de autenticação protegendo todas as rotas da API
- Hash de senhas com bcryptjs
- Armazenamento de token no localStorage
- Auto-login após registro
- Logout com limpeza de token
- Proteção de rotas no frontend com ProtectedRoute

### ✅ Conexão ao WhatsApp
- QR code gerado automaticamente via whatsapp-web.js
- Exibição do QR code em tempo real via WebSocket
- Status de conexão atualizado automaticamente
- Suporte a reconexão automática

### ✅ Gerenciamento de Números Autorizados
- Adicionar números via interface
- Remover números da lista
- Validação de formato de número
- API REST para CRUD de números (protegida por JWT)

### ✅ Respostas Automáticas
- **Lógica implementada**: Mensagens recebidas de números autorizados recebem resposta automática
- Apenas números na lista de autorizados recebem respostas
- Mensagens de números não autorizados são registradas mas ignoradas

### ✅ Log de Mensagens
- Histórico de mensagens recebidas e enviadas
- Indicadores visuais de direção (recebida/enviada)
- Timestamps formatados
- Atualização em tempo real via WebSocket

### ✅ Página de Configurações
- Interface dedicada para gerenciar configurações do sistema
- Formulário com validação para os seguintes campos:
  - Username
  - Password
  - Company
  - Instance
  - Line
  - Grant Type
- Salvamento persistente das configurações
- Navegação fácil via botão de engrenagem no header
- Suporte a armazenamento em memória e SQL Server

## Como Funciona

### 1. Conexão ao WhatsApp

Quando o frontend carrega:
1. Estabelece conexão WebSocket com o servidor
2. Automaticamente emite evento `initialize-whatsapp`
3. Servidor inicia cliente WhatsApp com Puppeteer/Chromium
4. QR code é gerado e enviado via Socket.IO
5. Usuário escaneia QR code no celular
6. Após autenticação, status muda para "Conectado"

### 2. Processamento de Mensagens

Quando uma mensagem é recebida:
1. WhatsApp client detecta mensagem via evento `message`
2. Extrai número do remetente
3. Verifica se número está na lista de autorizados (`storage.getAuthorizedNumberByPhone`)
4. Se autorizado: envia resposta automática
5. Armazena mensagem recebida e resposta no storage
6. Notifica frontend via Socket.IO evento `new-message`
7. Frontend invalida cache e recarrega mensagens

### 3. Armazenamento

**Atenção**: O sistema usa armazenamento em memória (MemStorage):
- Números autorizados e mensagens são perdidos ao reiniciar o servidor
- Para persistência entre reinicializações, considere migrar para banco de dados PostgreSQL

## APIs Disponíveis

### Autenticação (Rotas Públicas)

#### POST /api/auth/register
Registra novo usuário e retorna token JWT
```json
{
  "username": "usuario",
  "password": "senha123"
}
```
Resposta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "usuario"
  }
}
```

#### POST /api/auth/login
Faz login e retorna token JWT
```json
{
  "username": "usuario",
  "password": "senha123"
}
```
Resposta: mesma estrutura do registro

#### GET /api/auth/me
Retorna informações do usuário autenticado
Requer: Header `Authorization: Bearer <token>`

### Rotas Protegidas (Requerem JWT)

**Todas as rotas abaixo requerem o header:**
```
Authorization: Bearer <seu-token-jwt>
```

#### GET /api/authorized-numbers
Retorna lista de números autorizados

#### POST /api/authorized-numbers
Adiciona novo número autorizado
```json
{
  "phone": "+351912345678",
  "label": "João Silva"
}
```

#### DELETE /api/authorized-numbers/:id
Remove número autorizado

#### GET /api/messages
Retorna histórico de mensagens (ordenado por mais recente)

#### GET /api/settings
Retorna as configurações do sistema
Resposta:
```json
{
  "id": "uuid",
  "username": "user",
  "password": "pass",
  "company": "Company Name",
  "instance": "instance-id",
  "line": "line-id",
  "grantType": "client_credentials"
}
```
Retorna `null` se nenhuma configuração foi salva

#### POST /api/settings
Salva ou atualiza as configurações do sistema
```json
{
  "username": "user",
  "password": "pass",
  "company": "Company Name",
  "instance": "instance-id",
  "line": "line-id",
  "grantType": "client_credentials"
}
```

## WebSocket Events

### Cliente → Servidor
- `initialize-whatsapp` - Inicia conexão WhatsApp

### Servidor → Cliente
- `qr-code` - QR code gerado (base64 data URL)
- `whatsapp-ready` - WhatsApp conectado e pronto
- `whatsapp-authenticated` - Autenticação bem-sucedida
- `whatsapp-disconnected` - Desconectado do WhatsApp
- `new-message` - Nova mensagem recebida ou enviada
- `error` - Erro durante operação

## Dependências do Sistema

O WhatsApp Web usa Puppeteer/Chromium que requer as seguintes dependências do sistema (já instaladas):

- chromium
- glib
- at-spi2-atk
- cups
- gtk3
- libdrm
- mesa
- nss
- pango
- xorg.libxcb
- xorg.libXcomposite
- xorg.libXdamage
- xorg.libXext
- xorg.libXfixes
- xorg.libXrandr
- alsa-lib
- libxkbcommon

## Limitações Conhecidas

1. **Armazenamento volátil**: Mensagens e números autorizados são perdidos ao reiniciar
2. **Sessão WhatsApp**: A sessão é armazenada em `.wwebjs_auth/` e persiste entre reinicializações
3. **Single instance**: Apenas uma conexão WhatsApp por servidor
4. **Resposta fixa**: A mensagem de resposta automática é fixa no código (pode ser parametrizada)

## Melhorias Futuras Sugeridas

1. **Persistência**: Migrar para PostgreSQL usando Drizzle ORM
2. **Templates de resposta**: Permitir mensagens personalizadas por número
3. **Agendamento**: Sistema de mensagens agendadas
4. **Mídia**: Suporte para envio de imagens/documentos
5. **Webhooks**: Notificações externas de novas mensagens
6. **Multi-sessão**: Suporte a múltiplos números WhatsApp

## Desenvolvimento

### Executar Localmente
```bash
npm run dev
```

Acesse: http://localhost:5000

### Estrutura de Rotas
- `/` - Dashboard principal
- `/api/*` - Endpoints da API REST

## Notas Técnicas

- **Dark Mode**: Suportado via ThemeToggle component
- **Responsive**: Interface adaptada para mobile e desktop
- **Real-time**: Todas as atualizações são em tempo real via WebSocket
- **Type Safety**: TypeScript em toda a aplicação com tipos compartilhados
- **Validação**: Zod schemas para validação de dados

## Segurança

### ✅ Autenticação JWT Implementada
- Sistema de autenticação baseado em JWT (JSON Web Tokens)
- Todas as rotas da API protegidas com middleware de autenticação
- Senhas armazenadas com hash bcryptjs (10 rounds)
- Tokens JWT com expiração de 7 dias
- **IMPORTANTE**: Configure JWT_SECRET em produção (atualmente usando chave padrão)
- Proteção de rotas no frontend com ProtectedRoute component

### Armazenamento de Dados
- **SQL Server (opcional)**: Suporte para armazenamento persistente
  - Configurável via variáveis de ambiente (DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_PORT)
  - Fallback automático para armazenamento em memória se SQL Server não estiver disponível
  - Tabelas criadas automaticamente ao conectar
- **In-memory (padrão)**: Armazenamento volátil quando banco de dados não configurado
- WhatsApp session é privada e armazenada localmente em `.wwebjs_auth/`
- Não expõe credenciais ou tokens do WhatsApp
- CORS configurado para aceitar qualquer origem (ajustar para produção)

### Variáveis de Ambiente Opcionais
```
JWT_SECRET=seu-secret-seguro-em-producao
DB_HOST=endereco-do-sql-server
DB_PORT=1433
DB_NAME=Advir
DB_USERNAME=sa
DB_PASSWORD=sua-senha
```

## Histórico de Mudanças

### 30 de Outubro de 2025 - Página de Configurações
- ✅ Adicionada tabela de settings no schema com campos: username, password, company, instance, line, grantType
- ✅ Implementados métodos de storage (getSettings e upsertSettings) para MemStorage e SqlServerStorage
- ✅ Criadas rotas da API GET e POST /api/settings
- ✅ Desenvolvida página de Configurações com formulário validado
- ✅ Adicionado botão de navegação para Configurações no header do Dashboard
- ✅ Implementado botão de voltar na página de Configurações
- ✅ Todas as alterações revisadas e aprovadas pelo arquiteto

### 29 de Outubro de 2025 - Autenticação JWT
- ✅ Implementado sistema completo de autenticação JWT
- ✅ Middleware de autenticação protegendo todas as rotas da API
- ✅ Página de login/registro no frontend
- ✅ Contexto de autenticação com AuthProvider
- ✅ Proteção de rotas com ProtectedRoute component
- ✅ Suporte a SQL Server com fallback para armazenamento em memória
- ✅ Integração do token JWT em todas as requisições HTTP
- ✅ Botão de logout no dashboard
- ✅ Exibição do username do usuário logado

### 29 de Outubro de 2025 - Versão Inicial
- Versão inicial do sistema implementada com todas as funcionalidades básicas de automação WhatsApp
