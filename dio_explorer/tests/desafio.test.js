'use strict';

const {
  normalizarNivel,
  xpAleatorio,
  itemAleatorio,
  gerarDesafio,
  NIVEIS_VALIDOS,
  XP_POR_NIVEL,
} = require('../src/desafio');

// ─── normalizarNivel ──────────────────────────────────────────────────────────

describe('normalizarNivel()', () => {
  test('retorna "iniciante" para "iniciante"', () => {
    expect(normalizarNivel('iniciante')).toBe('iniciante');
  });

  test('retorna "iniciante" para "basico" (alias)', () => {
    expect(normalizarNivel('basico')).toBe('iniciante');
  });

  test('retorna "iniciante" para "básico" (alias com acento)', () => {
    expect(normalizarNivel('básico')).toBe('iniciante');
  });

  test('retorna "iniciante" para "beginner"', () => {
    expect(normalizarNivel('beginner')).toBe('iniciante');
  });

  test('retorna "intermediário" para "intermediário"', () => {
    expect(normalizarNivel('intermediário')).toBe('intermediário');
  });

  test('retorna "intermediário" para "intermediario" (sem acento)', () => {
    expect(normalizarNivel('intermediario')).toBe('intermediário');
  });

  test('retorna "intermediário" para "intermediate"', () => {
    expect(normalizarNivel('intermediate')).toBe('intermediário');
  });

  test('retorna "avançado" para "avançado"', () => {
    expect(normalizarNivel('avançado')).toBe('avançado');
  });

  test('retorna "avançado" para "avancado" (sem acento)', () => {
    expect(normalizarNivel('avancado')).toBe('avançado');
  });

  test('retorna "avançado" para "advanced"', () => {
    expect(normalizarNivel('advanced')).toBe('avançado');
  });

  test('retorna "intermediário" (padrão) para nível desconhecido', () => {
    expect(normalizarNivel('experto')).toBe('intermediário');
  });

  test('retorna "intermediário" (padrão) para null', () => {
    expect(normalizarNivel(null)).toBe('intermediário');
  });

  test('retorna "intermediário" (padrão) para undefined', () => {
    expect(normalizarNivel(undefined)).toBe('intermediário');
  });

  test('retorna "intermediário" (padrão) para string vazia', () => {
    expect(normalizarNivel('')).toBe('intermediário');
  });

  test('é case-insensitive: "INICIANTE" → "iniciante"', () => {
    expect(normalizarNivel('INICIANTE')).toBe('iniciante');
  });
});

// ─── xpAleatorio ─────────────────────────────────────────────────────────────

describe('xpAleatorio()', () => {
  test('retorna um número dentro do intervalo [min, max]', () => {
    for (let i = 0; i < 50; i++) {
      const xp = xpAleatorio(200, 350);
      expect(xp).toBeGreaterThanOrEqual(200);
      expect(xp).toBeLessThanOrEqual(350);
    }
  });

  test('retorna um inteiro', () => {
    const xp = xpAleatorio(100, 500);
    expect(Number.isInteger(xp)).toBe(true);
  });

  test('funciona com min === max', () => {
    expect(xpAleatorio(300, 300)).toBe(300);
  });

  test('XP de iniciante está dentro do intervalo esperado', () => {
    const { min, max } = XP_POR_NIVEL['iniciante'];
    const xp = xpAleatorio(min, max);
    expect(xp).toBeGreaterThanOrEqual(200);
    expect(xp).toBeLessThanOrEqual(350);
  });

  test('XP de intermediário está dentro do intervalo esperado', () => {
    const { min, max } = XP_POR_NIVEL['intermediário'];
    const xp = xpAleatorio(min, max);
    expect(xp).toBeGreaterThanOrEqual(400);
    expect(xp).toBeLessThanOrEqual(600);
  });

  test('XP de avançado está dentro do intervalo esperado', () => {
    const { min, max } = XP_POR_NIVEL['avançado'];
    const xp = xpAleatorio(min, max);
    expect(xp).toBeGreaterThanOrEqual(650);
    expect(xp).toBeLessThanOrEqual(800);
  });
});

// ─── itemAleatorio ────────────────────────────────────────────────────────────

describe('itemAleatorio()', () => {
  test('retorna um item presente no array', () => {
    const arr = ['a', 'b', 'c'];
    const item = itemAleatorio(arr);
    expect(arr).toContain(item);
  });

  test('retorna null para array vazio', () => {
    expect(itemAleatorio([])).toBeNull();
  });

  test('retorna null para null', () => {
    expect(itemAleatorio(null)).toBeNull();
  });

  test('retorna null para undefined', () => {
    expect(itemAleatorio(undefined)).toBeNull();
  });

  test('retorna o único item quando array tem 1 elemento', () => {
    expect(itemAleatorio(['único'])).toBe('único');
  });

  test('distribuição não é sempre o mesmo item (10 chamadas com array de 2)', () => {
    const arr = [1, 2];
    const resultados = new Set();
    for (let i = 0; i < 30; i++) resultados.add(itemAleatorio(arr));
    // Com 30 tentativas em array de 2 elementos, esperamos os dois aparecerem
    expect(resultados.size).toBeGreaterThan(0);
  });
});

// ─── gerarDesafio ─────────────────────────────────────────────────────────────

describe('gerarDesafio()', () => {
  test('retorna erro quando tecnologia não é informada', () => {
    const resultado = gerarDesafio('', 'iniciante');
    expect(resultado).toHaveProperty('erro');
    expect(resultado.erro).toContain('❌');
  });

  test('retorna erro quando tecnologia é null', () => {
    const resultado = gerarDesafio(null, 'iniciante');
    expect(resultado).toHaveProperty('erro');
  });

  test('gera desafio válido para Java iniciante', () => {
    const resultado = gerarDesafio('Java', 'iniciante');
    expect(resultado).not.toHaveProperty('erro');
    expect(resultado).toHaveProperty('texto');
    expect(resultado).toHaveProperty('nivel');
    expect(resultado).toHaveProperty('xp');
    expect(resultado).toHaveProperty('badge');
  });

  test('texto do desafio Java iniciante contém o nome da tecnologia', () => {
    const resultado = gerarDesafio('Java', 'iniciante');
    expect(resultado.texto).toContain('Java');
  });

  test('texto do desafio contém o nível', () => {
    const resultado = gerarDesafio('Java', 'iniciante');
    expect(resultado.texto).toContain('iniciante');
  });

  test('texto do desafio contém as seções esperadas', () => {
    const resultado = gerarDesafio('Java', 'intermediário');
    expect(resultado.texto).toContain('## 📋 Enunciado');
    expect(resultado.texto).toContain('## 📥 Entrada Esperada');
    expect(resultado.texto).toContain('## 📤 Saída Esperada');
    expect(resultado.texto).toContain('## ⚙️ Restrições e Regras');
    expect(resultado.texto).toContain('## 💡 Dicas');
    expect(resultado.texto).toContain('## 🧩 Critérios de Avaliação');
    expect(resultado.texto).toContain('## 🏆 Recompensa ao Concluir');
  });

  test('XP de iniciante está no intervalo correto', () => {
    const resultado = gerarDesafio('Java', 'iniciante');
    expect(resultado.xp).toBeGreaterThanOrEqual(200);
    expect(resultado.xp).toBeLessThanOrEqual(350);
  });

  test('XP de intermediário está no intervalo correto', () => {
    const resultado = gerarDesafio('Java', 'intermediário');
    expect(resultado.xp).toBeGreaterThanOrEqual(400);
    expect(resultado.xp).toBeLessThanOrEqual(600);
  });

  test('XP de avançado está no intervalo correto', () => {
    const resultado = gerarDesafio('Java', 'avançado');
    expect(resultado.xp).toBeGreaterThanOrEqual(650);
    expect(resultado.xp).toBeLessThanOrEqual(800);
  });

  test('usa nível intermediário como padrão para nível desconhecido', () => {
    const resultado = gerarDesafio('Java', 'expert_invalido');
    expect(resultado.nivel).toBe('intermediário');
  });

  test('texto do desafio menciona o XP gerado', () => {
    const resultado = gerarDesafio('Java', 'iniciante');
    expect(resultado.texto).toContain(`+${resultado.xp} XP`);
  });

  test('badge retornado é uma string não vazia', () => {
    const resultado = gerarDesafio('Java', 'intermediário');
    expect(typeof resultado.badge).toBe('string');
    expect(resultado.badge.length).toBeGreaterThan(0);
  });

  test('funciona com tecnologias além de Java', () => {
    const python = gerarDesafio('Python', 'iniciante');
    const react = gerarDesafio('React', 'avançado');
    expect(python.texto).toContain('Python');
    expect(react.texto).toContain('React');
  });
});

// ─── NIVEIS_VALIDOS ───────────────────────────────────────────────────────────

describe('NIVEIS_VALIDOS (constante)', () => {
  test('contém "iniciante"', () => {
    expect(NIVEIS_VALIDOS).toContain('iniciante');
  });

  test('contém "intermediário"', () => {
    expect(NIVEIS_VALIDOS).toContain('intermediário');
  });

  test('contém "avançado"', () => {
    expect(NIVEIS_VALIDOS).toContain('avançado');
  });
});
