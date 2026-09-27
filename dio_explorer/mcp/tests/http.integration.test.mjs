/**
 * Teste de integração do servidor MCP HTTP: sobe build/http.js como
 * processo real (mesmo binário publicado) e fala o protocolo MCP de
 * verdade via SDK oficial (@modelcontextprotocol/sdk/client), em vez de
 * importar as funções internas. Isso é o que garante que o handshake,
 * o transporte HTTP Streamable e a autenticação funcionam fora do papel —
 * nenhum teste unitário de src/*.js cobre essa camada.
 *
 * Requer build atualizado: rode `npm run build` antes de `npm run test:integration`.
 *
 * Uso: node --test tests/http.integration.test.mjs
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTTP_ENTRY = path.resolve(__dirname, '../build/http.js');

const PORT_SEM_AUTH = 4578;
const PORT_COM_AUTH = 4579;
const API_KEY = 'chave-de-teste-integracao';

let servidorSemAuth;
let servidorComAuth;

function iniciarServidor(porta, envExtra = {}) {
  return spawn(process.execPath, [HTTP_ENTRY], {
    env: {
      ...process.env,
      DIO_MCP_PORT: String(porta),
      DIO_MCP_HOST: '127.0.0.1',
      ...envExtra,
    },
    stdio: 'pipe',
  });
}

async function aguardarSaude(porta, tentativas = 40) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${porta}/health`);
      if (resp.ok) return;
    } catch {
      // ainda não subiu
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Servidor MCP HTTP na porta ${porta} não respondeu a tempo.`);
}

before(async () => {
  servidorSemAuth = iniciarServidor(PORT_SEM_AUTH);
  servidorComAuth = iniciarServidor(PORT_COM_AUTH, { DIO_MCP_API_KEY: API_KEY });
  await Promise.all([aguardarSaude(PORT_SEM_AUTH), aguardarSaude(PORT_COM_AUTH)]);
});

after(() => {
  servidorSemAuth?.kill();
  servidorComAuth?.kill();
});

test('GET /health responde 200 com status ok', async () => {
  const resp = await fetch(`http://127.0.0.1:${PORT_SEM_AUTH}/health`);
  assert.equal(resp.status, 200);
  const body = await resp.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'dio-explorer-mcp');
});

test('protocolo MCP real: listTools expõe as 6 ferramentas', async () => {
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PORT_SEM_AUTH}/mcp`));
  await client.connect(transport);

  const { tools } = await client.listTools();
  const nomes = tools.map((t) => t.name).sort();
  assert.deepEqual(nomes, [
    'buscar_trilha',
    'consultar_progresso',
    'emitir_certificado',
    'gerar_desafio',
    'listar_tecnologias',
    'listar_trilhas',
  ]);

  await client.close();
});

test('protocolo MCP real: fluxo completo trilha -> desafio -> certificado -> progresso', async () => {
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PORT_SEM_AUTH}/mcp`));
  await client.connect(transport);

  const usuario = `Integração MCP ${Date.now()}`;

  const trilha = await client.callTool({
    name: 'buscar_trilha',
    arguments: { tecnologia: 'Python', nome_usuario: usuario },
  });
  assert.match(trilha.content[0].text, /Plano de Estudos/);

  const desafio = await client.callTool({
    name: 'gerar_desafio',
    arguments: { tecnologia: 'Java', nivel: 'avançado', nome_usuario: usuario },
  });
  assert.match(desafio.content[0].text, /Desafio de Código/);

  const certificado = await client.callTool({
    name: 'emitir_certificado',
    arguments: { nome_usuario: usuario, tecnologia: 'Python' },
  });
  assert.match(certificado.content[0].text, /CERTIFICADO DE CONCLUSÃO/);

  const progresso = await client.callTool({
    name: 'consultar_progresso',
    arguments: { nome_usuario: usuario },
  });
  assert.match(progresso.content[0].text, /Trilhas Consultadas/);
  assert.match(progresso.content[0].text, /- Python/);
  assert.match(progresso.content[0].text, /Java \(avançado\)/);

  await client.close();
});

test('tecnologia inexistente retorna isError via protocolo MCP', async () => {
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PORT_SEM_AUTH}/mcp`));
  await client.connect(transport);

  const resultado = await client.callTool({
    name: 'buscar_trilha',
    arguments: { tecnologia: 'linguagem-fantasma-xyz' },
  });
  assert.equal(resultado.isError, true);

  await client.close();
});

test('servidor com DIO_MCP_API_KEY configurada: requisição sem token é rejeitada', async () => {
  const resp = await fetch(`http://127.0.0.1:${PORT_COM_AUTH}/mcp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', id: 1 }),
  });
  assert.equal(resp.status, 401);
});

test('servidor com DIO_MCP_API_KEY configurada: requisição com token válido é aceita', async () => {
  const client = new Client({ name: 'integration-test', version: '1.0.0' });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${PORT_COM_AUTH}/mcp`),
    { requestInit: { headers: { Authorization: `Bearer ${API_KEY}` } } }
  );
  await client.connect(transport);

  const { tools } = await client.listTools();
  assert.ok(tools.length > 0);

  await client.close();
});
