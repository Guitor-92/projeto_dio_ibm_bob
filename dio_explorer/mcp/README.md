# DIO Explorer — MCP Server

Servidor MCP do **DIO Explorer** que expõe as funcionalidades de trilhas, desafios e certificados como ferramentas consumíveis por qualquer cliente MCP — Bob, Claude Desktop, ou qualquer integração via API HTTP.

---

## Ferramentas disponíveis

| Ferramenta | Descrição |
|---|---|
| `listar_tecnologias` | Lista todas as tecnologias do catálogo DIO com nome, nível e XP |
| `listar_trilhas` | Lista trilhas com resumo; aceita filtro por nível |
| `buscar_trilha` | Busca trilha por tecnologia e retorna plano de estudos completo |
| `gerar_desafio` | Gera desafio de código por tecnologia e nível (iniciante / intermediário / avançado) |
| `emitir_certificado` | Emite certificado fictício de conclusão em Markdown com ID único |

---

## Pré-requisitos

- Node.js >= 18
- npm >= 9

---

## Instalação

```bash
cd dio_explorer/mcp
npm install
npm run build
```

---

## Modo 1 — stdio (Bob / Claude Desktop)

Transporte padrão. O Bob spawna o processo automaticamente via `.bob/mcp.json`.

### Registro manual em `.bob/mcp.json`

```json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["/caminho/absoluto/dio_explorer/mcp/build/index.js"],
      "env": {}
    }
  }
}
```

Após salvar, o Bob recarrega o servidor automaticamente.

---

## Modo 2 — HTTP (acesso remoto / API / SSO)

O servidor HTTP expõe os mesmos 5 tools via `POST /mcp` e um health check em `GET /health`.

### Iniciar

```bash
node dio_explorer/mcp/build/http.js
```

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DIO_MCP_PORT` | `3000` | Porta do servidor HTTP |
| `DIO_MCP_HOST` | `0.0.0.0` | Interface de rede |
| `DIO_MCP_TLS_CERT` | — | Caminho do certificado `.pem` → ativa HTTPS |
| `DIO_MCP_TLS_KEY` | — | Caminho da chave privada `.pem` → ativa HTTPS |
| `DIO_MCP_API_KEY` | — | Chave de API estática (Bearer token) |
| `DIO_MCP_JWT_SECRET` | — | Secret HMAC-HS256 para validar JWTs / SSO |
| `DIO_MCP_CORS_ORIGINS` | `*` | Origens CORS, separadas por vírgula |

### Exemplo — HTTP simples (desenvolvimento)

```bash
DIO_MCP_PORT=3000 node dio_explorer/mcp/build/http.js
```

### Exemplo — HTTPS com TLS

```bash
DIO_MCP_PORT=443 \
DIO_MCP_TLS_CERT=/etc/ssl/certs/meu-cert.pem \
DIO_MCP_TLS_KEY=/etc/ssl/private/meu-cert.key \
DIO_MCP_API_KEY=minha-chave-secreta \
node dio_explorer/mcp/build/http.js
```

### Exemplo — Autenticação com JWT/SSO

Configure o seu IdP (Keycloak, Auth0, Azure AD, etc.) para emitir tokens HS256 com o secret configurado:

```bash
DIO_MCP_JWT_SECRET=meu-secret-compartilhado \
node dio_explorer/mcp/build/http.js
```

O cliente envia o token JWT no header:

```
Authorization: Bearer <token-jwt>
```

---

## Autenticação

O módulo [`src/auth.ts`](src/auth.ts) suporta dois mecanismos, avaliados nesta ordem:

1. **API Key estática** — `DIO_MCP_API_KEY` no ambiente; cliente envia `Authorization: Bearer <key>` ou `?api_key=<key>` na query string.
2. **JWT HS256** — `DIO_MCP_JWT_SECRET` no ambiente; o servidor valida a assinatura e a expiração (`exp`) do token.

Se nenhuma variável estiver configurada, o servidor sobe **sem autenticação** (modo desenvolvimento — não use em produção).

---

## Endpoints HTTP

| Método | Caminho | Auth | Descrição |
|---|---|---|---|
| `POST` | `/mcp` | Sim | Protocolo MCP (JSON-RPC Streamable HTTP) |
| `GET` | `/health` | Não | Health check — retorna status, versão e timestamp |

### Exemplo de health check

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "service": "dio-explorer-mcp",
  "version": "1.0.0",
  "transport": "http",
  "tls": false,
  "timestamp": "2025-07-15T12:00:00.000Z"
}
```

### Exemplo de chamada MCP via HTTP

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer minha-chave" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "id": 1,
    "params": {
      "name": "buscar_trilha",
      "arguments": { "tecnologia": "Java" }
    }
  }'
```

---

## Estrutura de arquivos

```
dio_explorer/mcp/
├── src/
│   ├── index.ts     # Servidor stdio (Bob / Claude Desktop)
│   ├── http.ts      # Servidor HTTP/HTTPS (acesso remoto / SSO)
│   └── auth.ts      # Middleware de autenticação (API Key + JWT)
├── build/           # Saída compilada (gerada por `npm run build`)
├── package.json
├── tsconfig.json
└── README.md        # Este arquivo
```

---

## Deploy em produção (sugestão)

Para expor o servidor publicamente com HTTPS, a abordagem recomendada é usar um **reverse proxy** (nginx, Caddy, Traefik) na frente do servidor HTTP:

```
Internet → nginx (TLS termination) → http://localhost:3000/mcp
```

Ou usar as variáveis `DIO_MCP_TLS_CERT` / `DIO_MCP_TLS_KEY` para TLS direto no processo Node.js.

---

## Rebuild após alterações

Sempre que modificar arquivos em `src/`, recompile antes de reiniciar:

```bash
cd dio_explorer/mcp
npm run build
```
