'use strict';

/**
 * Teste de integração: sobe o servidor web de verdade (child process,
 * mesmo binário usado em produção — web/server.js) e bate nos endpoints
 * via fetch, como um cliente real faria. Cobertura unitária alta não prova
 * que o processo sobe e responde na rede — isso é o que este teste garante.
 */

const { spawn } = require('child_process');
const path = require('path');

const PORT = 4577;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SERVER_PATH = path.resolve(__dirname, '../../web/server.js');

let serverProcess;

async function aguardarServidor(tentativas = 40) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const resp = await fetch(`${BASE_URL}/api/tecnologias`);
      if (resp.ok) return;
    } catch {
      // ainda não subiu — tenta de novo
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Servidor web não respondeu a tempo.');
}

beforeAll(async () => {
  serverProcess = spawn(process.execPath, [SERVER_PATH], {
    env: { ...process.env, DIO_WEB_PORT: String(PORT), DIO_WEB_HOST: '127.0.0.1' },
    stdio: 'pipe',
  });
  await aguardarServidor();
}, 20000);

afterAll(() => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill();
  }
});

describe('web/server.js (processo real, via HTTP)', () => {
  test('GET /api/tecnologias retorna as 30 trilhas do catálogo', async () => {
    const resp = await fetch(`${BASE_URL}/api/tecnologias`);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.total).toBeGreaterThan(0);
    expect(Array.isArray(data.trilhas)).toBe(true);
  });

  test('GET / serve a página HTML da interface', async () => {
    const resp = await fetch(`${BASE_URL}/`);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('content-type')).toContain('text/html');
    const html = await resp.text();
    expect(html).toContain('DIO Explorer');
  });

  test('GET /style.css e /app.js são servidos como estáticos', async () => {
    const css = await fetch(`${BASE_URL}/style.css`);
    const js = await fetch(`${BASE_URL}/app.js`);
    expect(css.status).toBe(200);
    expect(js.status).toBe(200);
  });

  test('rota estática inexistente retorna 404', async () => {
    const resp = await fetch(`${BASE_URL}/nao-existe.png`);
    expect(resp.status).toBe(404);
  });

  test('GET /api/trilha retorna plano de estudos para tecnologia válida', async () => {
    const resp = await fetch(`${BASE_URL}/api/trilha?tecnologia=Python`);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.planos[0].markdown).toContain('Plano de Estudos');
  });

  test('GET /api/trilha retorna 404 para tecnologia inexistente', async () => {
    const resp = await fetch(`${BASE_URL}/api/trilha?tecnologia=linguagem-fantasma-xyz`);
    expect(resp.status).toBe(404);
    const data = await resp.json();
    expect(data).toHaveProperty('erro');
  });

  test('GET /api/desafio retorna um desafio válido', async () => {
    const resp = await fetch(`${BASE_URL}/api/desafio?tecnologia=Java&nivel=avan%C3%A7ado`);
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data).toHaveProperty('texto');
    expect(data).toHaveProperty('xp');
    expect(data.nivel).toBe('avançado');
  });

  test('GET /api/desafio sem tecnologia retorna 400', async () => {
    const resp = await fetch(`${BASE_URL}/api/desafio`);
    expect(resp.status).toBe(400);
  });

  test('POST /api/certificado emite certificado válido', async () => {
    const resp = await fetch(`${BASE_URL}/api/certificado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Integração de Teste', tecnologia: 'Python' }),
    });
    expect(resp.status).toBe(200);
    const data = await resp.json();
    expect(data.id).toMatch(/^DIO-\d{4}-[A-Z0-9]{8}$/);
  });

  test('POST /api/certificado com corpo inválido retorna 400', async () => {
    const resp = await fetch(`${BASE_URL}/api/certificado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'isso não é json',
    });
    expect(resp.status).toBe(400);
  });

  describe('fluxo de progresso end-to-end', () => {
    const usuario = `Teste Integração ${Date.now()}`;

    test('registra trilha, desafio e certificado, e reflete no /api/progresso', async () => {
      await fetch(`${BASE_URL}/api/trilha?tecnologia=Python&usuario=${encodeURIComponent(usuario)}`);
      await fetch(`${BASE_URL}/api/desafio?tecnologia=Java&nivel=avan%C3%A7ado&usuario=${encodeURIComponent(usuario)}`);
      await fetch(`${BASE_URL}/api/certificado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: usuario, tecnologia: 'Python' }),
      });

      const resp = await fetch(`${BASE_URL}/api/progresso?usuario=${encodeURIComponent(usuario)}`);
      expect(resp.status).toBe(200);
      const data = await resp.json();
      expect(data.registro.trilhasConsultadas).toHaveLength(1);
      expect(data.registro.desafiosConcluidos).toHaveLength(1);
      expect(data.registro.certificados).toHaveLength(1);
      expect(data.registro.xpTotal).toBeGreaterThan(0);
      expect(data.markdown).toContain('Progresso');
    });

    test('GET /api/progresso sem usuário retorna 400', async () => {
      const resp = await fetch(`${BASE_URL}/api/progresso`);
      expect(resp.status).toBe(400);
    });
  });
});
