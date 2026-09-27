'use strict';

// ── Utilidades de DOM ────────────────────────────────────────────────────
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const resultadoWrapper = $('#resultado-wrapper');
const resultadoEl = $('#resultado');
const statusEl = $('#resultado-status');
const loadingEl = $('#loading');
const btnCopiar = $('#btn-copiar');

let ultimoMarkdown = '';

// ── Nome do usuário (persistido localmente para associar o progresso) ────
const usuarioInput = $('#usuario-atual');
usuarioInput.value = localStorage.getItem('dio-explorer-usuario') || '';
usuarioInput.addEventListener('input', () => {
  localStorage.setItem('dio-explorer-usuario', usuarioInput.value.trim());
});
function usuarioAtual() {
  return usuarioInput.value.trim();
}

// ── Troca de abas ────────────────────────────────────────────────────────
$$('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $(`#tab-${btn.dataset.tab}`).classList.add('active');
    resultadoWrapper.hidden = true;
    if (btn.dataset.tab === 'progresso') {
      carregarProgresso();
    }
  });
});

// ── Conversor Markdown -> HTML mínimo e seguro ──────────────────────────
// Escapa HTML primeiro; só depois aplica as substituições de sintaxe.
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function markdownToHtml(md) {
  const escaped = escapeHtml(md);
  const lines = escaped.split('\n');
  const htmlLines = [];
  let inCodeBlock = false;
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      htmlLines.push('</ul>');
      listOpen = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      htmlLines.push(inCodeBlock ? '<pre><code>' : '</code></pre>');
      continue;
    }
    if (inCodeBlock) {
      htmlLines.push(line);
      continue;
    }
    if (/^\s*---\s*$/.test(line)) {
      closeList();
      htmlLines.push('<hr />');
      continue;
    }
    if (/^# /.test(line)) {
      closeList();
      htmlLines.push(`<h1>${inline(line.slice(2))}</h1>`);
      continue;
    }
    if (/^## /.test(line)) {
      closeList();
      htmlLines.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (/^### /.test(line)) {
      closeList();
      htmlLines.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (/^&gt;\s?/.test(line)) {
      closeList();
      htmlLines.push(`<blockquote>${inline(line.replace(/^&gt;\s?/, ''))}</blockquote>`);
      continue;
    }
    if (/^[-•]\s+/.test(line)) {
      if (!listOpen) {
        htmlLines.push('<ul>');
        listOpen = true;
      }
      htmlLines.push(`<li>${inline(line.replace(/^[-•]\s+/, ''))}</li>`);
      continue;
    }
    closeList();
    if (line.trim() === '') {
      htmlLines.push('<br />');
    } else {
      htmlLines.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return htmlLines.join('\n');
}

function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

// ── Renderização de resultado ─────────────────────────────────────────────
function mostrarResultado({ markdown, status, erro }) {
  loadingEl.hidden = true;
  resultadoWrapper.hidden = false;

  if (erro) {
    statusEl.textContent = `❌ ${erro}`;
    statusEl.className = 'error';
    resultadoEl.innerHTML = '';
    resultadoEl.hidden = true;
    btnCopiar.hidden = true;
    return;
  }

  statusEl.textContent = status || '✅ Gerado com sucesso';
  statusEl.className = 'success';
  ultimoMarkdown = markdown;
  resultadoEl.innerHTML = markdownToHtml(markdown);
  resultadoEl.hidden = false;
  btnCopiar.hidden = false;
}

btnCopiar.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(ultimoMarkdown);
    btnCopiar.textContent = '✅ Copiado!';
    setTimeout(() => (btnCopiar.textContent = '📋 Copiar Markdown'), 1500);
  } catch {
    btnCopiar.textContent = '❌ Não foi possível copiar';
  }
});

async function chamarApi(input, init) {
  loadingEl.hidden = false;
  resultadoWrapper.hidden = true;
  try {
    const resp = await fetch(input, init);
    const data = await resp.json();
    return { ok: resp.ok, data };
  } catch (err) {
    return { ok: false, data: { erro: 'Falha de rede ao contatar o servidor.' } };
  } finally {
    loadingEl.hidden = true;
  }
}

// ── Formulário: Trilha ────────────────────────────────────────────────────
$('#form-trilha').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const tecnologia = $('#trilha-tecnologia').value.trim();
  const params = new URLSearchParams({ tecnologia });
  if (usuarioAtual()) params.set('usuario', usuarioAtual());
  const { ok, data } = await chamarApi(`/api/trilha?${params.toString()}`);
  if (!ok) {
    mostrarResultado({ erro: data.erro || 'Não foi possível buscar a trilha.' });
    return;
  }
  const markdown = data.planos.map((p) => p.markdown).join('\n\n---\n\n');
  mostrarResultado({ markdown, status: `✅ ${data.total} trilha(s) encontrada(s)` });
});

// ── Formulário: Desafio ───────────────────────────────────────────────────
$('#form-desafio').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const tecnologia = $('#desafio-tecnologia').value.trim();
  const nivel = $('#desafio-nivel').value;
  const params = new URLSearchParams({ tecnologia });
  if (nivel) params.set('nivel', nivel);
  if (usuarioAtual()) params.set('usuario', usuarioAtual());
  const { ok, data } = await chamarApi(`/api/desafio?${params.toString()}`);
  if (!ok) {
    mostrarResultado({ erro: data.erro || 'Não foi possível gerar o desafio.' });
    return;
  }
  mostrarResultado({ markdown: data.texto, status: `✅ Nível ${data.nivel} • +${data.xp} XP` });
});

// ── Formulário: Certificado ───────────────────────────────────────────────
$('#form-certificado').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nome = $('#certificado-nome').value.trim();
  const tecnologia = $('#certificado-tecnologia').value.trim();
  const { ok, data } = await chamarApi('/api/certificado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, tecnologia, usuario: usuarioAtual() || nome }),
  });
  if (!ok) {
    mostrarResultado({ erro: data.erro || 'Não foi possível emitir o certificado.' });
    return;
  }
  mostrarResultado({ markdown: data.texto, status: `✅ Certificado ${data.id}` });
});

// ── Aba: Progresso ─────────────────────────────────────────────────────────
async function carregarProgresso() {
  const usuario = usuarioAtual();
  if (!usuario) {
    resultadoWrapper.hidden = true;
    return;
  }
  const { ok, data } = await chamarApi(`/api/progresso?usuario=${encodeURIComponent(usuario)}`);
  if (!ok) {
    mostrarResultado({ erro: data.erro || 'Não foi possível carregar o progresso.' });
    return;
  }
  const r = data.registro;
  mostrarResultado({
    markdown: data.markdown,
    status: `✅ ${r.trilhasConsultadas.length} trilha(s) • ${r.desafiosConcluidos.length} desafio(s) • ${r.certificados.length} certificado(s)`,
  });
}

$('#btn-atualizar-progresso').addEventListener('click', carregarProgresso);
