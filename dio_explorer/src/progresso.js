'use strict';

const fs = require('fs');
const path = require('path');

// Caminho padrão já reservado no .gitignore ("Cache de progresso de usuários")
const DATA_PATH_PADRAO = path.resolve(__dirname, '../data/cache-progresso/progresso.json');

/**
 * Carrega o arquivo de progresso do disco. Se não existir, retorna uma
 * estrutura vazia (não cria o arquivo — isso só acontece ao salvar).
 * @param {string} [caminho]
 * @returns {{ usuarios: Object }}
 */
function carregarProgresso(caminho = DATA_PATH_PADRAO) {
  if (!fs.existsSync(caminho)) {
    return { usuarios: {} };
  }
  try {
    const raw = fs.readFileSync(caminho, 'utf-8');
    const dados = JSON.parse(raw);
    if (!dados || typeof dados !== 'object' || typeof dados.usuarios !== 'object') {
      return { usuarios: {} };
    }
    return dados;
  } catch {
    return { usuarios: {} };
  }
}

/**
 * Persiste a estrutura de progresso no disco (cria diretório se necessário).
 * @param {{ usuarios: Object }} dados
 * @param {string} [caminho]
 */
function salvarProgresso(dados, caminho = DATA_PATH_PADRAO) {
  const dir = path.dirname(caminho);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2), 'utf-8');
}

function chaveUsuario(usuario) {
  return usuario.trim().toLowerCase();
}

function registroVazio(nomeOriginal) {
  return {
    nome: nomeOriginal,
    xpTotal: 0,
    trilhasConsultadas: [],
    desafiosConcluidos: [],
    certificados: [],
  };
}

function validarUsuario(usuario) {
  return typeof usuario === 'string' && usuario.trim() !== '';
}

/**
 * Registra a consulta de uma trilha para o usuário informado.
 * @param {string} usuario
 * @param {string} tecnologia
 * @param {{ caminho?: string }} [opcoes]
 * @returns {{ registro: object } | { erro: string }}
 */
function registrarTrilhaConsultada(usuario, tecnologia, opcoes = {}) {
  if (!validarUsuario(usuario)) return { erro: '❌ Nome de usuário inválido ou não informado.' };
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return { erro: '❌ Tecnologia inválida ou não informada.' };
  }

  const dados = carregarProgresso(opcoes.caminho);
  const chave = chaveUsuario(usuario);
  const registro = dados.usuarios[chave] || registroVazio(usuario.trim());

  registro.trilhasConsultadas.push({
    tecnologia: tecnologia.trim(),
    data: new Date().toISOString(),
  });

  dados.usuarios[chave] = registro;
  salvarProgresso(dados, opcoes.caminho);
  return { registro };
}

/**
 * Registra a conclusão de um desafio para o usuário informado, somando o XP.
 * @param {string} usuario
 * @param {string} tecnologia
 * @param {string} nivel
 * @param {number} xp
 * @param {{ caminho?: string }} [opcoes]
 * @returns {{ registro: object } | { erro: string }}
 */
function registrarDesafioConcluido(usuario, tecnologia, nivel, xp, opcoes = {}) {
  if (!validarUsuario(usuario)) return { erro: '❌ Nome de usuário inválido ou não informado.' };
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return { erro: '❌ Tecnologia inválida ou não informada.' };
  }
  const xpNumero = typeof xp === 'number' && !Number.isNaN(xp) ? xp : 0;

  const dados = carregarProgresso(opcoes.caminho);
  const chave = chaveUsuario(usuario);
  const registro = dados.usuarios[chave] || registroVazio(usuario.trim());

  registro.desafiosConcluidos.push({
    tecnologia: tecnologia.trim(),
    nivel: nivel || 'intermediário',
    xp: xpNumero,
    data: new Date().toISOString(),
  });
  registro.xpTotal += xpNumero;

  dados.usuarios[chave] = registro;
  salvarProgresso(dados, opcoes.caminho);
  return { registro };
}

/**
 * Registra a emissão de um certificado para o usuário informado.
 * @param {string} usuario
 * @param {string} tecnologia
 * @param {string} certificadoId
 * @param {{ caminho?: string }} [opcoes]
 * @returns {{ registro: object } | { erro: string }}
 */
function registrarCertificadoEmitido(usuario, tecnologia, certificadoId, opcoes = {}) {
  if (!validarUsuario(usuario)) return { erro: '❌ Nome de usuário inválido ou não informado.' };
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return { erro: '❌ Tecnologia inválida ou não informada.' };
  }

  const dados = carregarProgresso(opcoes.caminho);
  const chave = chaveUsuario(usuario);
  const registro = dados.usuarios[chave] || registroVazio(usuario.trim());

  registro.certificados.push({
    tecnologia: tecnologia.trim(),
    id: certificadoId || null,
    data: new Date().toISOString(),
  });

  dados.usuarios[chave] = registro;
  salvarProgresso(dados, opcoes.caminho);
  return { registro };
}

/**
 * Retorna o resumo de progresso de um usuário.
 * @param {string} usuario
 * @param {{ caminho?: string }} [opcoes]
 * @returns {{ registro: object } | { erro: string }}
 */
function obterResumoProgresso(usuario, opcoes = {}) {
  if (!validarUsuario(usuario)) return { erro: '❌ Nome de usuário inválido ou não informado.' };

  const dados = carregarProgresso(opcoes.caminho);
  const chave = chaveUsuario(usuario);
  const registro = dados.usuarios[chave] || registroVazio(usuario.trim());
  return { registro };
}

/**
 * Formata o resumo de progresso de um usuário em Markdown.
 * @param {object} registro - retorno de obterResumoProgresso(...).registro
 * @returns {string}
 */
function formatarResumoProgresso(registro) {
  if (!registro) return '';

  const trilhas = registro.trilhasConsultadas.length
    ? registro.trilhasConsultadas.map((t) => `- ${t.tecnologia}`).join('\n')
    : '_Nenhuma trilha consultada ainda._';

  const desafios = registro.desafiosConcluidos.length
    ? registro.desafiosConcluidos
        .map((d) => `- ${d.tecnologia} (${d.nivel}) — +${d.xp} XP`)
        .join('\n')
    : '_Nenhum desafio concluído ainda._';

  const certificados = registro.certificados.length
    ? registro.certificados.map((c) => `- ${c.tecnologia} — \`${c.id}\``).join('\n')
    : '_Nenhum certificado emitido ainda._';

  return [
    `# 📈 Progresso — ${registro.nome}`,
    '',
    `**XP Total Acumulado:** ${registro.xpTotal} XP`,
    '',
    '---',
    '',
    '## 📚 Trilhas Consultadas',
    '',
    trilhas,
    '',
    '---',
    '',
    '## ⚔️ Desafios Concluídos',
    '',
    desafios,
    '',
    '---',
    '',
    '## 🎓 Certificados Emitidos',
    '',
    certificados,
  ].join('\n');
}

module.exports = {
  carregarProgresso,
  salvarProgresso,
  registrarTrilhaConsultada,
  registrarDesafioConcluido,
  registrarCertificadoEmitido,
  obterResumoProgresso,
  formatarResumoProgresso,
};
