'use strict';

const {
  buscarTrilha,
  calcularCargaHoraria,
  formatarPromocao,
  formatarPlanoEstudos,
  carregarTrilhas,
} = require('../src/trilhas');

// ─── carregarTrilhas ──────────────────────────────────────────────────────────

describe('carregarTrilhas()', () => {
  test('retorna um array não vazio', () => {
    const trilhas = carregarTrilhas();
    expect(Array.isArray(trilhas)).toBe(true);
    expect(trilhas.length).toBeGreaterThan(0);
  });

  test('cada trilha possui os campos obrigatórios', () => {
    const trilhas = carregarTrilhas();
    trilhas.forEach((t) => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('nome');
      expect(t).toHaveProperty('tecnologia');
      expect(t).toHaveProperty('nivel');
      expect(t).toHaveProperty('numero_de_modulos');
      expect(t).toHaveProperty('xp_total');
      expect(t).toHaveProperty('badges_disponiveis');
      expect(t).toHaveProperty('promocoes');
      expect(t).toHaveProperty('vitalicio');
      expect(t).toHaveProperty('lives_ao_vivo');
    });
  });
});

// ─── buscarTrilha ─────────────────────────────────────────────────────────────

describe('buscarTrilha()', () => {
  // --- caso de sucesso: Java ---
  test('encontra a trilha de Java por tecnologia exata', () => {
    const resultado = buscarTrilha('Java');
    expect(resultado.length).toBeGreaterThan(0);
    const trilha = resultado[0];
    expect(trilha.tecnologia).toBe('Java');
    expect(trilha.nome).toBe('Formação Java Developer');
  });

  test('encontra trilha de Java com busca case-insensitive', () => {
    const resultado = buscarTrilha('java');
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado[0].tecnologia).toBe('Java');
  });

  test('encontra trilha de Java com busca parcial maiúscula', () => {
    const resultado = buscarTrilha('JAV');
    expect(resultado.length).toBeGreaterThan(0);
  });

  test('a trilha de Java tem 14 módulos', () => {
    const [trilha] = buscarTrilha('Java');
    expect(trilha.numero_de_modulos).toBe(14);
  });

  test('a trilha de Java tem 18000 XP', () => {
    const [trilha] = buscarTrilha('Java');
    expect(trilha.xp_total).toBe(18000);
  });

  test('a trilha de Java possui badges esperadas', () => {
    const [trilha] = buscarTrilha('Java');
    expect(trilha.badges_disponiveis).toContain('Java Starter');
    expect(trilha.badges_disponiveis).toContain('Spring Boot Hero');
    expect(trilha.badges_disponiveis).toContain('Java Master');
  });

  test('a trilha de Java tem lives ao vivo', () => {
    const [trilha] = buscarTrilha('Java');
    expect(trilha.lives_ao_vivo.length).toBeGreaterThan(0);
    expect(trilha.lives_ao_vivo[0]).toHaveProperty('titulo');
    expect(trilha.lives_ao_vivo[0]).toHaveProperty('instrutor');
    expect(trilha.lives_ao_vivo[0]).toHaveProperty('data');
  });

  // --- outros casos ---
  test('encontra trilha de Python', () => {
    const resultado = buscarTrilha('Python');
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado[0].nome).toBe('Formação Python Developer');
  });

  test('encontra trilha de React', () => {
    const resultado = buscarTrilha('React');
    expect(resultado.length).toBeGreaterThan(0);
  });

  test('retorna array vazio para tecnologia inexistente', () => {
    const resultado = buscarTrilha('XPTO_INEXISTENTE_123');
    expect(resultado).toEqual([]);
  });

  test('retorna array vazio para string vazia', () => {
    expect(buscarTrilha('')).toEqual([]);
  });

  test('retorna array vazio para espaços em branco', () => {
    expect(buscarTrilha('   ')).toEqual([]);
  });

  test('retorna array vazio para null', () => {
    expect(buscarTrilha(null)).toEqual([]);
  });

  test('retorna array vazio para undefined', () => {
    expect(buscarTrilha(undefined)).toEqual([]);
  });

  test('retorna array vazio para número', () => {
    expect(buscarTrilha(42)).toEqual([]);
  });

  test('busca por nome parcial da trilha funciona', () => {
    const resultado = buscarTrilha('Formação Python');
    expect(resultado.length).toBeGreaterThan(0);
  });
});

// ─── calcularCargaHoraria ─────────────────────────────────────────────────────

describe('calcularCargaHoraria()', () => {
  test('calcula corretamente para trilha de Java (14 módulos = 112h)', () => {
    const [trilha] = buscarTrilha('Java');
    expect(calcularCargaHoraria(trilha)).toBe(112);
  });

  test('calcula corretamente para trilha de Python (12 módulos = 96h)', () => {
    const [trilha] = buscarTrilha('Python');
    expect(calcularCargaHoraria(trilha)).toBe(96);
  });

  test('retorna 0 para trilha null', () => {
    expect(calcularCargaHoraria(null)).toBe(0);
  });

  test('retorna 0 para trilha sem numero_de_modulos', () => {
    expect(calcularCargaHoraria({})).toBe(0);
  });

  test('retorna 0 para numero_de_modulos não numérico', () => {
    expect(calcularCargaHoraria({ numero_de_modulos: 'doze' })).toBe(0);
  });
});

// ─── formatarPromocao ─────────────────────────────────────────────────────────

describe('formatarPromocao()', () => {
  test('exibe promoção ativa corretamente para Java', () => {
    // Java não tem promoção ativa no JSON
    const [trilha] = buscarTrilha('Java');
    const resultado = formatarPromocao(trilha);
    expect(resultado).toBe('❌ Sem promoção ativa no momento');
  });

  test('exibe promoção ativa corretamente para Python', () => {
    const [trilha] = buscarTrilha('Python');
    const resultado = formatarPromocao(trilha);
    expect(resultado).toContain('✅');
    expect(resultado).toContain('30%');
    expect(resultado).toContain('2025-12-31');
  });

  test('retorna mensagem sem promoção para trilha null', () => {
    expect(formatarPromocao(null)).toBe('❌ Sem promoção ativa no momento');
  });

  test('retorna mensagem sem promoção quando promocoes ausente', () => {
    expect(formatarPromocao({})).toBe('❌ Sem promoção ativa no momento');
  });
});

// ─── formatarPlanoEstudos ─────────────────────────────────────────────────────

describe('formatarPlanoEstudos()', () => {
  test('retorna string não vazia para trilha de Java', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(typeof plano).toBe('string');
    expect(plano.length).toBeGreaterThan(0);
  });

  test('contém o nome da trilha no plano de Java', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('Formação Java Developer');
  });

  test('contém a tecnologia no plano', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('Java');
  });

  test('contém o XP total no plano', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('18000');
  });

  test('contém a seção de badges', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('🏅 Badges Disponíveis');
  });

  test('contém a seção de lives ao vivo', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('🎥 Lives ao Vivo');
  });

  test('contém informações de acesso', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('💰 Informações de Acesso');
  });

  test('retorna string vazia para trilha null', () => {
    expect(formatarPlanoEstudos(null)).toBe('');
  });

  test('exibe "Acesso vitalício: ✅ Sim" para Java (vitalicio=true)', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    expect(plano).toContain('✅ Sim');
  });

  test('a carga horária calculada aparece no plano', () => {
    const [trilha] = buscarTrilha('Java');
    const plano = formatarPlanoEstudos(trilha);
    // 14 módulos × 8h = 112h
    expect(plano).toContain('112h');
  });
});
