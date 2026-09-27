/**
 * http.ts — Servidor HTTP/HTTPS para o DIO Explorer MCP
 *
 * Inicia o mesmo servidor MCP (mesmas 5 ferramentas) via transporte HTTP
 * em vez de stdio, para acesso remoto, integração SSO e deploy em nuvem.
 *
 * Configuração via variáveis de ambiente:
 *
 *   DIO_MCP_PORT          Porta HTTP (padrão: 3000)
 *   DIO_MCP_HOST          Host a escutar (padrão: 0.0.0.0)
 *   DIO_MCP_TLS_CERT      Caminho para o certificado TLS (.pem) → ativa HTTPS
 *   DIO_MCP_TLS_KEY       Caminho para a chave privada TLS (.pem) → ativa HTTPS
 *   DIO_MCP_API_KEY       Chave de API estática para autenticação Bearer
 *   DIO_MCP_JWT_SECRET    Secret HMAC-HS256 para validar tokens JWT/SSO
 *   DIO_MCP_CORS_ORIGINS  Origens CORS permitidas, separadas por vírgula
 *                         Ex: "https://app.meusite.com,https://admin.meusite.com"
 *                         Padrão em dev: "*"
 *
 * Endpoints expostos:
 *   POST /mcp             Protocolo MCP (JSON-RPC sobre HTTP Streamable)
 *   GET  /health          Health check (retorna 200 + JSON com status e versão)
 *
 * Uso:
 *   node build/http.js
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { authenticate, sendUnauthorized } from './auth.js';

// ── Paths e imports dos módulos CJS do projeto ────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, '../../src');

// No Windows, import() dinâmico exige uma URL file:// — um caminho absoluto
// cru ("C:\...") é rejeitado pelo loader ESM com ERR_UNSUPPORTED_ESM_URL_SCHEME.
function importCjs(nomeArquivo: string): Promise<any> {
  return import(pathToFileURL(path.join(srcPath, nomeArquivo)).href);
}

const { carregarTrilhas, buscarTrilha, formatarPlanoEstudos } = await importCjs('trilhas.js');
const { gerarDesafio } = await importCjs('desafio.js');
const { gerarCertificado } = await importCjs('certificados.js');
const {
  registrarTrilhaConsultada,
  registrarDesafioConcluido,
  registrarCertificadoEmitido,
  obterResumoProgresso,
  formatarResumoProgresso,
} = await importCjs('progresso.js');

// ── Configuração do ambiente ──────────────────────────────────────────────
const PORT = parseInt(process.env.DIO_MCP_PORT ?? '3000', 10);
const HOST = process.env.DIO_MCP_HOST ?? '0.0.0.0';
const TLS_CERT = process.env.DIO_MCP_TLS_CERT ?? '';
const TLS_KEY = process.env.DIO_MCP_TLS_KEY ?? '';
const CORS_ORIGINS = (process.env.DIO_MCP_CORS_ORIGINS ?? '*').split(',').map((s) => s.trim());

const USE_TLS = Boolean(TLS_CERT && TLS_KEY);
const PROTOCOL = USE_TLS ? 'https' : 'http';

// ── Factory: cria uma instância MCP com as 5 ferramentas ─────────────────
function createMcpServer(): McpServer {
  const srv = new McpServer({ name: 'dio-explorer', version: '1.0.0' });

  // 1. listar_tecnologias
  srv.registerTool(
    'listar_tecnologias',
    {
      description: 'Lista todas as tecnologias disponíveis no catálogo DIO.',
      inputSchema: z.object({}),
    },
    async () => {
      const trilhas = carregarTrilhas() as Array<{
        nome: string; tecnologia: string; nivel: string; xp_total: number;
      }>;
      const lista = trilhas
        .map((t) => `• ${t.tecnologia} — ${t.nome} (${t.nivel}) | ${t.xp_total} XP`)
        .join('\n');
      return {
        content: [{ type: 'text' as const, text: `# Tecnologias DIO\n\n${lista}\n\nTotal: ${trilhas.length} trilhas` }],
      };
    }
  );

  // 2. listar_trilhas
  srv.registerTool(
    'listar_trilhas',
    {
      description: 'Lista trilhas com resumo. Filtra opcionalmente por nível.',
      inputSchema: z.object({
        nivel: z.enum(['Básico', 'Intermediário', 'Avançado', 'todos']).optional().default('todos'),
      }),
    },
    async ({ nivel }) => {
      const trilhas = carregarTrilhas() as Array<{
        id: number; nome: string; tecnologia: string; nivel: string;
        numero_de_modulos: number; xp_total: number; vitalicio: boolean;
        promocoes: { ativa: boolean; desconto_percentual: number };
      }>;
      const filtradas = nivel === 'todos'
        ? trilhas
        : trilhas.filter((t) => t.nivel.toLowerCase().includes(nivel.toLowerCase()));
      const lista = filtradas.map((t) => {
        const promo = t.promocoes.ativa ? ` 🏷️ ${t.promocoes.desconto_percentual}% OFF` : '';
        return `**[${t.id}] ${t.nome}** — ${t.tecnologia} | ${t.nivel} | ${t.numero_de_modulos} módulos | ${t.xp_total} XP${promo}`;
      }).join('\n\n');
      return { content: [{ type: 'text' as const, text: `# Trilhas DIO (${filtradas.length})\n\n${lista}` }] };
    }
  );

  // 3. buscar_trilha
  srv.registerTool(
    'buscar_trilha',
    {
      description: 'Busca trilha por tecnologia e retorna plano de estudos completo.',
      inputSchema: z.object({
        tecnologia: z.string().min(1).describe('Ex: "Java", "Python", "AWS"'),
        nome_usuario: z.string().optional().describe('Opcional. Registra a consulta no progresso do usuário.'),
      }),
    },
    async ({ tecnologia, nome_usuario }) => {
      const resultados = buscarTrilha(tecnologia) as unknown[];
      if (resultados.length === 0) {
        return {
          content: [{ type: 'text' as const, text: `❌ Trilha "${tecnologia}" não encontrada. Use listar_tecnologias para ver as opções.` }],
          isError: true,
        };
      }
      if (nome_usuario) {
        registrarTrilhaConsultada(nome_usuario, tecnologia);
      }
      const textos = (resultados as object[]).map((t) => formatarPlanoEstudos(t) as string);
      return { content: [{ type: 'text' as const, text: textos.join('\n\n---\n\n') }] };
    }
  );

  // 4. gerar_desafio
  srv.registerTool(
    'gerar_desafio',
    {
      description: 'Gera um desafio de código para a tecnologia e nível escolhidos.',
      inputSchema: z.object({
        tecnologia: z.string().min(1),
        nivel: z.enum(['iniciante', 'intermediário', 'avançado']).optional().default('intermediário'),
        nome_usuario: z.string().optional().describe('Opcional. Registra o desafio e o XP no progresso do usuário.'),
      }),
    },
    async ({ tecnologia, nivel, nome_usuario }) => {
      const resultado = gerarDesafio(tecnologia, nivel) as
        | { texto: string; nivel: string; xp: number; badge: string }
        | { erro: string };
      if ('erro' in resultado) {
        return { content: [{ type: 'text' as const, text: resultado.erro }], isError: true };
      }
      if (nome_usuario) {
        registrarDesafioConcluido(nome_usuario, tecnologia, resultado.nivel, resultado.xp);
      }
      return { content: [{ type: 'text' as const, text: resultado.texto }] };
    }
  );

  // 5. emitir_certificado
  srv.registerTool(
    'emitir_certificado',
    {
      description: 'Emite certificado de conclusão de trilha em Markdown com ID único.',
      inputSchema: z.object({
        nome_usuario: z.string().min(1).describe('Nome completo do aluno'),
        tecnologia: z.string().min(1).describe('Tecnologia ou trilha concluída'),
      }),
    },
    async ({ nome_usuario, tecnologia }) => {
      const resultado = gerarCertificado(nome_usuario, tecnologia) as
        | { texto: string; id: string; trilhaNome: string }
        | { erro: string };
      if ('erro' in resultado) {
        return { content: [{ type: 'text' as const, text: resultado.erro }], isError: true };
      }
      registrarCertificadoEmitido(nome_usuario, tecnologia, resultado.id);
      return {
        content: [{
          type: 'text' as const,
          text: `${resultado.texto}\n\n---\n🔐 **ID:** \`${resultado.id}\`\n📚 **Trilha:** ${resultado.trilhaNome}`,
        }],
      };
    }
  );

  // 6. consultar_progresso
  srv.registerTool(
    'consultar_progresso',
    {
      description: 'Consulta o histórico de progresso de um usuário: trilhas, desafios, certificados e XP total.',
      inputSchema: z.object({
        nome_usuario: z.string().min(1).describe('Nome do usuário. Ex: "João Silva"'),
      }),
    },
    async ({ nome_usuario }) => {
      const resultado = obterResumoProgresso(nome_usuario) as
        | { registro: object }
        | { erro: string };
      if ('erro' in resultado) {
        return { content: [{ type: 'text' as const, text: resultado.erro }], isError: true };
      }
      return {
        content: [{ type: 'text' as const, text: formatarResumoProgresso(resultado.registro) as string }],
      };
    }
  );

  return srv;
}

// ── Handler HTTP ──────────────────────────────────────────────────────────
async function handler(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const url = new URL(req.url ?? '/', `${PROTOCOL}://${req.headers.host ?? 'localhost'}`);

  // CORS
  const origin = req.headers.origin ?? '';
  const allowedOrigin = CORS_ORIGINS.includes('*') ? '*' : (CORS_ORIGINS.includes(origin) ? origin : '');
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check — público, sem autenticação
  if (url.pathname === '/health' && req.method === 'GET') {
    const body = JSON.stringify({
      status: 'ok',
      service: 'dio-explorer-mcp',
      version: '1.0.0',
      transport: 'http',
      tls: USE_TLS,
      timestamp: new Date().toISOString(),
    });
    res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
    return;
  }

  // Endpoint MCP — requer autenticação
  if (url.pathname === '/mcp') {
    const authResult = await authenticate(req);
    if (!authResult.ok) {
      sendUnauthorized(res, authResult.reason ?? 'Acesso não autorizado.');
      return;
    }

    // Uma instância MCP por request (stateless HTTP)
    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    res.on('close', () => {
      void transport.close();
      void mcpServer.close();
    });

    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
    return;
  }

  // Rota não encontrada
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', path: url.pathname }));
}

// ── Criação do servidor HTTP ou HTTPS ────────────────────────────────────
async function startServer(): Promise<void> {
  let server: http.Server | https.Server;

  if (USE_TLS) {
    const tlsOptions = {
      cert: fs.readFileSync(TLS_CERT),
      key: fs.readFileSync(TLS_KEY),
    };
    server = https.createServer(tlsOptions, handler);
    console.error(`[dio-explorer-mcp] Modo: HTTPS (TLS habilitado)`);
  } else {
    server = http.createServer(handler);
    console.error(`[dio-explorer-mcp] Modo: HTTP (sem TLS — use um reverse proxy com TLS em produção)`);
  }

  server.listen(PORT, HOST, () => {
    console.error(`[dio-explorer-mcp] Servidor HTTP iniciado em ${PROTOCOL}://${HOST}:${PORT}`);
    console.error(`[dio-explorer-mcp]   MCP endpoint : ${PROTOCOL}://localhost:${PORT}/mcp`);
    console.error(`[dio-explorer-mcp]   Health check : ${PROTOCOL}://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = (): void => {
    console.error('[dio-explorer-mcp] Encerrando servidor...');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[dio-explorer-mcp] Erro fatal ao iniciar servidor HTTP:', err);
  process.exit(1);
});
