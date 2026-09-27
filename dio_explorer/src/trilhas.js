'use strict';

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../data/trilhas_dio.json');

/**
 * Carrega e retorna o array de trilhas do JSON.
 * @returns {Array} lista de trilhas
 */
function carregarTrilhas() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return parsed.trilhas;
}

/**
 * Busca trilhas pelo nome da tecnologia (case-insensitive, parcial).
 * @param {string} tecnologia
 * @returns {Array} trilhas encontradas
 */
function buscarTrilha(tecnologia) {
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return [];
  }
  const termo = tecnologia.trim().toLowerCase();
  const trilhas = carregarTrilhas();
  return trilhas.filter(
    (t) =>
      t.tecnologia.toLowerCase().includes(termo) ||
      t.nome.toLowerCase().includes(termo)
  );
}

/**
 * Calcula a carga horária estimada de uma trilha (módulos × 8h).
 * @param {object} trilha
 * @returns {number} horas
 */
function calcularCargaHoraria(trilha) {
  if (!trilha || typeof trilha.numero_de_modulos !== 'number') return 0;
  return trilha.numero_de_modulos * 8;
}

/**
 * Retorna informações de promoção formatadas.
 * @param {object} trilha
 * @returns {string}
 */
function formatarPromocao(trilha) {
  if (!trilha || !trilha.promocoes) return '❌ Sem promoção ativa no momento';
  const { ativa, desconto_percentual, validade } = trilha.promocoes;
  if (ativa) {
    return `✅ ${desconto_percentual}% de desconto — válido até ${validade}`;
  }
  return '❌ Sem promoção ativa no momento';
}

/**
 * Formata o plano de estudos de uma trilha em texto.
 * @param {object} trilha
 * @returns {string}
 */
function formatarPlanoEstudos(trilha) {
  if (!trilha) return '';

  const carga = calcularCargaHoraria(trilha);
  const promocao = formatarPromocao(trilha);
  const vitalicio = trilha.vitalicio ? '✅ Sim' : '❌ Não';

  const badges = trilha.badges_disponiveis
    .map((b, i) => {
      const icones = ['🥇', '🥈', '🥉'];
      const icon = icones[i] || '🏅';
      return `${icon} ${b}`;
    })
    .join('\n');

  const lives = trilha.lives_ao_vivo
    .map(
      (l) =>
        `> 📅 **${l.titulo}**\n> 👤 Instrutor: ${l.instrutor} | 🗓️ Data: ${l.data}`
    )
    .join('\n\n');

  return [
    `# 🎓 Plano de Estudos — ${trilha.nome}`,
    '',
    `**Tecnologia:** ${trilha.tecnologia}`,
    `**Nível:** ${trilha.nivel}`,
    `**Total de Módulos:** ${trilha.numero_de_modulos}`,
    `**Carga Horária Total:** ${carga}h`,
    `**XP Total ao Concluir:** ${trilha.xp_total} XP`,
    '',
    '---',
    '',
    '## 🏅 Badges Disponíveis',
    '',
    badges,
    '',
    '---',
    '',
    '## 🎥 Lives ao Vivo',
    '',
    lives,
    '',
    '---',
    '',
    '## 💰 Informações de Acesso',
    '',
    `- **Acesso vitalício:** ${vitalicio}`,
    `- **Promoção ativa:** ${promocao}`,
  ].join('\n');
}

module.exports = {
  carregarTrilhas,
  buscarTrilha,
  calcularCargaHoraria,
  formatarPromocao,
  formatarPlanoEstudos,
};
