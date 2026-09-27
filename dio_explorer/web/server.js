#!/usr/bin/env node
'use strict';

/**
 * server.js — Interface web do DIO Explorer
 *
 * Servidor HTTP simples (só módulos nativos do Node, zero dependências)
 * que serve os arquivos estáticos de public/ e expõe uma API REST fina
 * sobre a mesma lógica de negócio já testada em ../src/*.js — a mesma
 * usada pelos slash commands e pelo servidor MCP.
 *
 * Rotas:
 *   GET  /api/tecnologias                                  -> lista todas as trilhas
 *   GET  /api/trilha?tecnologia=Python&usuario=...          -> plano(s) de estudo
 *   GET  /api/desafio?tecnologia=Java&nivel=...&usuario=... -> desafio de código
 *   POST /api/certificado  { nome, tecnologia, usuario? }   -> certificado em Markdown
 *   GET  /api/progresso?usuario=...                         -> resumo de progresso
 *
 * O parâmetro opcional "usuario" registra a ação no histórico de progresso
 * (persistido em data/cache-progresso/progresso.json via ../src/progresso.js).
 * Sem ele, os endpoints funcionam normalmente — o registro é opt-in.
 *
 * Variáveis de ambiente:
 *   DIO_WEB_PORT   Porta HTTP (padrão: 4000)
 *   DIO_WEB_HOST   Host a escutar (padrão: 0.0.0.0)
 *
 * Uso:
 *   node web/server.js
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const { carregarTrilhas, buscarTrilha, formatarPlanoEstudos } = require('../src/trilhas');
const { gerarDesafio } = require('../src/desafio');
const { gerarCertificado } = require('../src/certificados');
const {
  registrarTrilhaConsultada,
  registrarDesafioConcluido,
  registrarCertificadoEmitido,
  obterResumoProgresso,
  formatarResumoProgresso,
} = require('../src/progresso');

const PORT = parseInt(process.env.DIO_WEB_PORT || '4000', 10);
const HOST = process.env.DIO_WEB_HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Corpo da requisição excede o limite permitido.'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ── Handlers da API ──────────────────────────────────────────────────────
function handleTecnologias(req, res) {
  const trilhas = carregarTrilhas();
  const lista = trilhas.map((t) => ({
    id: t.id,
    tecnologia: t.tecnologia,
    nome: t.nome,
    nivel: t.nivel,
    xp_total: t.xp_total,
  }));
  sendJson(res, 200, { total: lista.length, trilhas: lista });
}

function handleTrilha(req, res, query) {
  const tecnologia = (query.tecnologia || '').toString();
  const usuario = (query.usuario || '').toString();
  const resultados = buscarTrilha(tecnologia);
  if (resultados.length === 0) {
    sendJson(res, 404, { erro: `Nenhuma trilha encontrada para "${tecnologia}".` });
    return;
  }
  const planos = resultados.map((t) => ({
    tecnologia: t.tecnologia,
    nome: t.nome,
    markdown: formatarPlanoEstudos(t),
  }));
  if (usuario) {
    registrarTrilhaConsultada(usuario, tecnologia);
  }
  sendJson(res, 200, { total: planos.length, planos });
}

function handleDesafio(req, res, query) {
  const tecnologia = (query.tecnologia || '').toString();
  const nivel = (query.nivel || '').toString();
  const usuario = (query.usuario || '').toString();
  const resultado = gerarDesafio(tecnologia, nivel);
  if (resultado.erro) {
    sendJson(res, 400, resultado);
    return;
  }
  if (usuario) {
    registrarDesafioConcluido(usuario, tecnologia, resultado.nivel, resultado.xp);
  }
  sendJson(res, 200, resultado);
}

async function handleCertificado(req, res) {
  let payload;
  try {
    const raw = await readRequestBody(req);
    payload = JSON.parse(raw || '{}');
  } catch (err) {
    sendJson(res, 400, { erro: 'Corpo da requisição inválido. Envie JSON com "nome" e "tecnologia".' });
    return;
  }
  const resultado = gerarCertificado(payload.nome, payload.tecnologia);
  if (resultado.erro) {
    sendJson(res, 400, resultado);
    return;
  }
  const usuario = (payload.usuario || payload.nome || '').toString();
  if (usuario) {
    registrarCertificadoEmitido(usuario, payload.tecnologia, resultado.id);
  }
  sendJson(res, 200, resultado);
}

function handleProgresso(req, res, query) {
  const usuario = (query.usuario || '').toString();
  const resultado = obterResumoProgresso(usuario);
  if (resultado.erro) {
    sendJson(res, 400, resultado);
    return;
  }
  sendJson(res, 200, {
    registro: resultado.registro,
    markdown: formatarResumoProgresso(resultado.registro),
  });
}

// ── Servidor de arquivos estáticos ──────────────────────────────────────
function serveStatic(req, res, pathname) {
  const target = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(target).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Não encontrado');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

// ── Roteador principal ────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  try {
    if (pathname === '/api/tecnologias' && req.method === 'GET') {
      return handleTecnologias(req, res);
    }
    if (pathname === '/api/trilha' && req.method === 'GET') {
      return handleTrilha(req, res, parsed.query);
    }
    if (pathname === '/api/desafio' && req.method === 'GET') {
      return handleDesafio(req, res, parsed.query);
    }
    if (pathname === '/api/certificado' && req.method === 'POST') {
      return await handleCertificado(req, res);
    }
    if (pathname === '/api/progresso' && req.method === 'GET') {
      return handleProgresso(req, res, parsed.query);
    }
    if (pathname.startsWith('/api/')) {
      return sendJson(res, 404, { erro: 'Rota de API não encontrada.' });
    }
    return serveStatic(req, res, pathname);
  } catch (err) {
    sendJson(res, 500, { erro: 'Erro interno do servidor.', detalhe: String(err && err.message) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[dio-explorer-web] Servidor iniciado em http://localhost:${PORT}`);
});
