'use strict';

const NIVEIS_VALIDOS = ['iniciante', 'intermediário', 'intermediario', 'avançado', 'avancado'];

const NIVEL_ALIASES = {
  basico: 'iniciante',
  básico: 'iniciante',
  beginner: 'iniciante',
  intermediate: 'intermediário',
  intermediario: 'intermediário',
  advanced: 'avançado',
  avancado: 'avançado',
};

const XP_POR_NIVEL = {
  iniciante: { min: 200, max: 350 },
  intermediário: { min: 400, max: 600 },
  avançado: { min: 650, max: 800 },
};

const DESAFIOS = {
  iniciante: [
    {
      titulo: 'Calculadora de IMC',
      enunciado:
        'Crie um programa que receba o peso (kg) e altura (m) de uma pessoa e calcule o seu IMC (Índice de Massa Corporal). Exiba o valor calculado e a classificação correspondente (Abaixo do peso, Normal, Sobrepeso, Obesidade).',
      entrada: 'Dois números reais: peso e altura',
      exemplo_entrada: '70.0\n1.75',
      exemplo_saida: 'IMC: 22.86 — Normal',
      restricoes: ['Não use bibliotecas externas', 'Trate entradas negativas ou zero como inválidas', 'Use arredondamento de 2 casas decimais'],
      dicas: ['IMC = peso / (altura * altura)', 'Use condicionais para classificar o resultado'],
      criterio_especifico: 'Trata corretamente todos os intervalos de classificação do IMC',
      badge: 'Health Data Coder',
    },
    {
      titulo: 'FizzBuzz Clássico',
      enunciado:
        'Escreva um programa que imprima os números de 1 a N. Para múltiplos de 3, imprima "Fizz"; para múltiplos de 5, imprima "Buzz"; para múltiplos de ambos, imprima "FizzBuzz".',
      entrada: 'Um inteiro N (1 ≤ N ≤ 1000)',
      exemplo_entrada: '15',
      exemplo_saida: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
      restricoes: ['Não use operações de string desnecessárias', 'N deve ser positivo'],
      dicas: ['Use o operador módulo (%)', 'Verifique o caso FizzBuzz antes dos outros'],
      criterio_especifico: 'A ordem das verificações está correta (FizzBuzz antes de Fizz/Buzz)',
      badge: 'Loop Master',
    },
  ],
  intermediário: [
    {
      titulo: 'Agenda de Contatos com Busca',
      enunciado:
        'Implemente uma agenda de contatos que permita: adicionar um contato (nome + telefone), buscar contatos pelo nome (parcial, case-insensitive) e listar todos os contatos em ordem alfabética. Use uma estrutura de dados adequada.',
      entrada: 'Sequência de comandos: ADD <nome> <telefone>, SEARCH <termo>, LIST',
      exemplo_entrada: 'ADD João 99999-0001\nADD Ana 88888-0002\nSEARCH jo\nLIST',
      exemplo_saida: 'Contato adicionado: João\nContato adicionado: Ana\nResultados: João (99999-0001)\nAna (88888-0002)\nJoão (99999-0001)',
      restricoes: ['Não use banco de dados', 'Nomes duplicados devem ser rejeitados', 'A busca deve ser case-insensitive'],
      dicas: ['Dicionários são ideais para armazenar contatos', 'Use sorted() para ordenação alfabética'],
      criterio_especifico: 'Utiliza a estrutura de dados adequada e trata duplicatas corretamente',
      badge: 'Data Structures Pro',
    },
  ],
  avançado: [
    {
      titulo: 'Cache LRU com TTL',
      enunciado:
        'Implemente um cache LRU (Least Recently Used) com suporte a TTL (Time To Live) por entrada. O cache deve ter capacidade máxima configurável e remover automaticamente entradas expiradas. Implemente os métodos get(key) e set(key, value, ttl_seconds).',
      entrada: 'Sequência de operações: SET <key> <value> <ttl>, GET <key>',
      exemplo_entrada: 'SET a 1 5\nGET a\nSET b 2 1\nGET b\n(após 2s) GET b',
      exemplo_saida: '1\n2\nNone',
      restricoes: ['Complexidade O(1) para get e set', 'Não use bibliotecas de cache externas', 'O TTL deve ser verificado no momento do acesso'],
      dicas: ['Combine OrderedDict com timestamps de expiração', 'Atualize a ordem ao fazer get para refletir uso recente'],
      criterio_especifico: 'Complexidade O(1) comprovada e TTL funcionando corretamente',
      badge: 'Cache Architect',
    },
  ],
};

/**
 * Normaliza o nível informado para a forma canônica.
 * @param {string} nivel
 * @returns {string} nível normalizado
 */
function normalizarNivel(nivel) {
  if (!nivel || typeof nivel !== 'string') return 'intermediário';
  const lower = nivel.trim().toLowerCase();
  if (NIVEL_ALIASES[lower]) return NIVEL_ALIASES[lower];
  if (NIVEIS_VALIDOS.includes(lower)) return lower;
  return 'intermediário';
}

/**
 * Gera um valor inteiro aleatório no intervalo [min, max].
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function xpAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Retorna um item aleatório de um array.
 * @param {Array} arr
 * @returns {*}
 */
function itemAleatorio(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Gera um desafio de código para a tecnologia e nível informados.
 * @param {string} tecnologia
 * @param {string} nivelBruto
 * @returns {{ texto: string, nivel: string, xp: number, badge: string } | { erro: string }}
 */
function gerarDesafio(tecnologia, nivelBruto) {
  if (!tecnologia || typeof tecnologia !== 'string' || tecnologia.trim() === '') {
    return { erro: '❌ Informe a tecnologia. Exemplo: /desafio Python iniciante' };
  }

  const nivel = normalizarNivel(nivelBruto);
  const pool = DESAFIOS[nivel];
  const desafio = itemAleatorio(pool);
  const { min, max } = XP_POR_NIVEL[nivel];
  const xp = xpAleatorio(min, max);

  const texto = [
    `# ⚔️ Desafio de Código — ${tecnologia.trim()} | Nível: ${nivel}`,
    '',
    '---',
    '',
    '## 📋 Enunciado',
    '',
    `**${desafio.titulo}**`,
    '',
    desafio.enunciado,
    '',
    '---',
    '',
    '## 📥 Entrada Esperada',
    '',
    desafio.entrada,
    '',
    '**Exemplo de entrada:**',
    '```',
    desafio.exemplo_entrada,
    '```',
    '',
    '---',
    '',
    '## 📤 Saída Esperada',
    '',
    '**Exemplo de saída:**',
    '```',
    desafio.exemplo_saida,
    '```',
    '',
    '---',
    '',
    '## ⚙️ Restrições e Regras',
    '',
    ...desafio.restricoes.map((r) => `- ${r}`),
    '',
    '---',
    '',
    '## 💡 Dicas',
    '',
    ...desafio.dicas.map((d) => `> 💭 ${d}`),
    '',
    '---',
    '',
    '## 🧩 Critérios de Avaliação',
    '',
    '- [ ] O código resolve o problema corretamente',
    '- [ ] Os casos extremos (edge cases) são tratados',
    '- [ ] O código está bem organizado e legível',
    `- [ ] ${desafio.criterio_especifico}`,
    '',
    '---',
    '',
    '## 🏆 Recompensa ao Concluir',
    '',
    `> +${xp} XP • Badge: **${desafio.badge}**`,
    '',
    '---',
    '',
    `> 🚀 Bora codar! Cole sua solução aqui para revisão ou use \`/trilha ${tecnologia.trim()}\` para ver o plano de estudos completo.`,
  ].join('\n');

  return { texto, nivel, xp, badge: desafio.badge };
}

module.exports = {
  normalizarNivel,
  xpAleatorio,
  itemAleatorio,
  gerarDesafio,
  NIVEIS_VALIDOS,
  XP_POR_NIVEL,
};
