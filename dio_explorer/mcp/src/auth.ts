/**
 * auth.ts — Middleware de autenticação para o servidor HTTP do DIO Explorer MCP
 *
 * Suporta dois mecanismos, configuráveis por variável de ambiente:
 *
 *   1. API Key estática
 *      Lê DIO_MCP_API_KEY do ambiente.
 *      O cliente deve enviar o header:  Authorization: Bearer <api-key>
 *      Ou via query string:             ?api_key=<api-key>
 *
 *   2. Bearer JWT (SSO / OAuth 2.0)
 *      Lê DIO_MCP_JWT_SECRET do ambiente.
 *      Valida tokens HS256 emitidos por qualquer IdP que compartilhe o secret.
 *      Para integração OIDC/OAuth externo, substitua a validação manual
 *      por uma chamada ao endpoint de introspecção do seu IdP.
 *
 * Se nenhuma das variáveis estiver configurada, o servidor roda sem autenticação
 * (modo desenvolvimento). Em produção, configure ao menos uma delas.
 */

import type { IncomingMessage, ServerResponse } from 'http';

export interface AuthResult {
  ok: boolean;
  reason?: string;
  subject?: string; // identidade do caller quando autenticado
}

// ── Leitura das credenciais do ambiente ───────────────────────────────────
const API_KEY = process.env.DIO_MCP_API_KEY ?? '';
const JWT_SECRET = process.env.DIO_MCP_JWT_SECRET ?? '';
const AUTH_DISABLED = !API_KEY && !JWT_SECRET;

if (AUTH_DISABLED) {
  console.error(
    '[auth] AVISO: nenhuma variável DIO_MCP_API_KEY ou DIO_MCP_JWT_SECRET configurada. ' +
      'O servidor HTTP está rodando SEM autenticação. Não use assim em produção.'
  );
}

// ── Decodificação JWT manual HS256 (sem dependências externas) ────────────
async function verifyJwt(token: string, secret: string): Promise<{ ok: boolean; sub?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { ok: false };

    const [headerB64, payloadB64, signatureB64] = parts;

    // Importa chave HMAC
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Reconstrói a assinatura e verifica
    const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(
      atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify('HMAC', keyMaterial, signature, data);
    if (!valid) return { ok: false };

    // Decodifica payload
    const payload = JSON.parse(
      atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
    ) as Record<string, unknown>;

    // Verifica expiração
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return { ok: false };
    }

    return { ok: true, sub: typeof payload.sub === 'string' ? payload.sub : undefined };
  } catch {
    return { ok: false };
  }
}

// ── Função principal de autenticação ─────────────────────────────────────
export async function authenticate(req: IncomingMessage): Promise<AuthResult> {
  // Modo sem autenticação (desenvolvimento)
  if (AUTH_DISABLED) {
    return { ok: true, subject: 'anonymous' };
  }

  // Extrai token do header Authorization ou query string
  const authHeader = req.headers['authorization'] ?? '';
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const queryKey = url.searchParams.get('api_key') ?? '';

  const rawToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : queryKey;

  if (!rawToken) {
    return { ok: false, reason: 'Token de autenticação ausente.' };
  }

  // 1. Tenta validar como API Key estática
  if (API_KEY && rawToken === API_KEY) {
    return { ok: true, subject: 'api-key-client' };
  }

  // 2. Tenta validar como JWT
  if (JWT_SECRET) {
    const jwtResult = await verifyJwt(rawToken, JWT_SECRET);
    if (jwtResult.ok) {
      return { ok: true, subject: jwtResult.sub ?? 'jwt-client' };
    }
  }

  return { ok: false, reason: 'Token inválido ou expirado.' };
}

// ── Helper: envia resposta 401 padronizada ────────────────────────────────
export function sendUnauthorized(res: ServerResponse, reason: string): void {
  const body = JSON.stringify({ error: 'Unauthorized', message: reason });
  res.writeHead(401, {
    'Content-Type': 'application/json',
    'WWW-Authenticate': 'Bearer realm="dio-explorer-mcp"',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}
