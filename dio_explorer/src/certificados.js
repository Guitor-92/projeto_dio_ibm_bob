'use strict';

const { buscarTrilha, calcularCargaHoraria } = require('./trilhas');

const CHARS_ID = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Gera um ID de certificado no formato DIO-<ANO>-<8 chars aleatórios>.
 * @param {number} [ano] - ano a usar; padrão: ano corrente
 * @returns {string}
 */
function gerarIdCertificado(ano) {
  const anoFinal = ano || new Date().getFullYear();
  let hash = '';
  for (let i = 0; i < 8; i++) {
    hash += CHARS_ID[Math.floor(Math.random() * CHARS_ID.length)];
  }
  return `DIO-${anoFinal}-${hash}`;
}

/**
 * Formata a data atual no padrão DD/MM/AAAA.
 * @param {Date} [data] - data a formatar; padrão: hoje
 * @returns {string}
 */
function formatarDataEmissao(data) {
  const d = data || new Date();
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Gera competências padrão para uma tecnologia quando a trilha não é encontrada.
 * @param {string} tecnologia
 * @returns {string[]}
 */
function gerarCompetenciasGenericas(tecnologia) {
  return [
    `Fundamentos e sintaxe de ${tecnologia}`,
    `Desenvolvimento de projetos práticos com ${tecnologia}`,
    `Boas práticas e padrões da comunidade ${tecnologia}`,
    `Resolução de problemas e debugging em ${tecnologia}`,
    `Integração de ${tecnologia} em ambientes de produção`,
  ];
}

/**
 * Gera o texto do certificado em Markdown.
 * @param {string} nomeUsuario
 * @param {string} tecnologia
 * @param {{ id?: string, data?: Date }} [opcoes]
 * @returns {{ texto: string, id: string, trilhaNome: string } | { erro: string }}
 */
function gerarCertificado(nomeUsuario, tecnologia, opcoes = {}) {
  if (!nomeUsuario || typeof nomeUsuario !== 'string' || nomeUsuario.trim() === '') {
    return { erro: '❌ Nome do usuário inválido ou não informado.' };
  }
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return { erro: '❌ Tecnologia inválida ou não informada.' };
  }

  const nome = nomeUsuario.trim();
  const tech = tecnologia.trim();

  const trilhasEncontradas = buscarTrilha(tech);
  const trilha = trilhasEncontradas.length > 0 ? trilhasEncontradas[0] : null;

  const trilhaNome = trilha ? trilha.nome : `Formação ${tech}`;
  const nivelTexto = trilha ? trilha.nivel : 'Intermediário';
  const xp = trilha ? trilha.xp_total : 10000;
  const carga = trilha ? calcularCargaHoraria(trilha) : 80;

  const badges = trilha && trilha.badges_disponiveis.length > 0
    ? trilha.badges_disponiveis.map((b) => `🏆 ${b}`).join(' | ')
    : `🏆 ${tech} Developer`;

  const competencias = trilha
    ? [
        `Domínio dos fundamentos de ${trilha.tecnologia}`,
        `Desenvolvimento de projetos reais com ${trilha.tecnologia}`,
        `Aplicação de boas práticas e padrões de projeto`,
        `Resolução de problemas complexos e otimização de código`,
        `Trabalho com as principais ferramentas do ecossistema ${trilha.tecnologia}`,
        `Capacidade de criar soluções escaláveis e manuteníveis`,
      ]
    : gerarCompetenciasGenericas(tech);

  const id = opcoes.id || gerarIdCertificado();
  const dataEmissao = formatarDataEmissao(opcoes.data);

  const texto = [
    '---',
    '',
    '<div align="center">',
    '',
    '# 🎓 CERTIFICADO DE CONCLUSÃO',
    '',
    '### Digital Innovation One — DIO Platform',
    '',
    '---',
    '',
    '## Certificamos que',
    '',
    `# 🏅 ${nome}`,
    '',
    'concluiu com êxito a trilha de formação',
    '',
    `## 📚 ${trilhaNome}`,
    '',
    `> **Tecnologia:** ${trilha ? trilha.tecnologia : tech}`,
    `> **Nível:** ${nivelTexto}`,
    `> **Carga Horária:** ${carga} horas`,
    `> **XP Conquistado:** ${xp} XP`,
    '',
    '---',
    '',
    '### ✅ Competências Desenvolvidas',
    '',
    ...competencias.map((c) => `✅ ${c}`),
    '',
    '---',
    '',
    '### 🏆 Badges Conquistadas',
    '',
    badges,
    '',
    '---',
    '',
    `📅 **Data de Emissão:** ${dataEmissao}`,
    `🔐 **ID do Certificado:** \`${id}\``,
    `🌐 **Verificação:** \`https://www.dio.me/certificate/${id}\``,
    '',
    '---',
    '',
    '*Este certificado é emitido pela plataforma DIO em reconhecimento*',
    '*ao comprometimento e dedicação do(a) aluno(a) com sua jornada de aprendizado.*',
    '',
    '</div>',
    '',
    '---',
  ].join('\n');

  return { texto, id, trilhaNome };
}

module.exports = {
  gerarIdCertificado,
  formatarDataEmissao,
  gerarCompetenciasGenericas,
  gerarCertificado,
};
