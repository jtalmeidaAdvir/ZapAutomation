# WhatsApp Automação - Sistema de Respostas Automáticas

## Visão Geral

Aplicação fullstack para conectar um número ao WhatsApp Web e enviar respostas automáticas apenas para números autorizados. Utiliza whatsapp-web.js (versão gratuita) para integração com WhatsApp.

## Tecnologias

### Backend
- **Node.js** com Express
- **whatsapp-web.js** - Integração com WhatsApp Web
- **Socket.IO** - Comunicação em tempo real para QR code e mensagens
- **In-memory storage** - Armazenamento de números autorizados e mensagens

### Frontend
- **React** com TypeScript
- **Shadcn UI** - Componentes de interface
- **TanStack Query** - Gerenciamento de estado e cache
- **Socket.IO Client** - Conexão WebSocket com backend
- **Tailwind CSS** - Estilização

## Estrutura do Projeto

```
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── hooks/       # Custom hooks (useWhatsApp)
│   │   ├── pages/       # Páginas da aplicação
│   │   └── lib/         # Utilitários
├── server/              # Backend Node.js
│   ├── routes.ts        # Rotas da API REST
│   ├── storage.ts       # Interface de armazenamento
│   ├── whatsapp.ts      # Serviço WhatsApp + Socket.IO
│   └── index.ts         # Servidor principal
└── shared/              # Tipos compartilhados
    └── schema.ts        # Schemas Zod e tipos TypeScript
```

## Funcionalidades Implementadas

### ✅ Conexão ao WhatsApp
- QR code gerado automaticamente via whatsapp-web.js
- Exibição do QR code em tempo real via WebSocket
- Status de conexão atualizado automaticamente
- Suporte a reconexão automática

### ✅ Gerenciamento de Números Autorizados
- Adicionar números via interface
- Remover números da lista
- Validação de formato de número
- API REST para CRUD de números

### ✅ Respostas Automáticas
- **Lógica implementada**: Mensagens recebidas de números autorizados recebem resposta automática
- Apenas números na lista de autorizados recebem respostas
- Mensagens de números não autorizados são registradas mas ignoradas

### ✅ Log de Mensagens
- Histórico de mensagens recebidas e enviadas
- Indicadores visuais de direção (recebida/enviada)
- Timestamps formatados
- Atualização em tempo real via WebSocket

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

### GET /api/authorized-numbers
Retorna lista de números autorizados

### POST /api/authorized-numbers
Adiciona novo número autorizado
```json
{
  "phone": "+351912345678",
  "label": "João Silva"
}
```

### DELETE /api/authorized-numbers/:id
Remove número autorizado

### GET /api/messages
Retorna histórico de mensagens (ordenado por mais recente)

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

- Não há autenticação de usuário implementada (apenas uma instância por servidor)
- WhatsApp session é privada e armazenada localmente
- Não expõe credenciais ou tokens do WhatsApp
- CORS configurado para aceitar qualquer origem (ajustar para produção)

## Data: 29 de Outubro de 2025
Versão inicial do sistema implementada com todas as funcionalidades básicas de automação WhatsApp.
