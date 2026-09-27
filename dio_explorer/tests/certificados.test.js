'use strict';

const {
  gerarIdCertificado,
  formatarDataEmissao,
  gerarCompetenciasGenericas,
  gerarCertificado,
} = require('../src/certificados');

// ─── gerarIdCertificado ───────────────────────────────────────────────────────

describe('gerarIdCertificado()', () => {
  test('retorna string no formato DIO-AAAA-XXXXXXXX', () => {
    const id = gerarIdCertificado();
    expect(id).toMatch(/^DIO-\d{4}-[A-Z0-9]{8}$/);
  });

  test('usa o ano corrente por padrão', () => {
    const anoAtual = new Date().getFullYear();
    const id = gerarIdCertificado();
    expect(id).toContain(`DIO-${anoAtual}-`);
  });

  test('usa ano customizado quando informado', () => {
    const id = gerarIdCertificado(2030);
    expect(id).toContain('DIO-2030-');
  });

  test('gera IDs únicos em chamadas consecutivas', () => {
    const ids = new Set();
    for (let i = 0; i < 20; i++) ids.add(gerarIdCertificado());
    expect(ids.size).toBeGreaterThan(1);
  });

  test('o hash tem exatamente 8 caracteres', () => {
    const id = gerarIdCertificado();
    const hash = id.split('-')[2];
    expect(hash.length).toBe(8);
  });

  test('o hash contém apenas letras maiúsculas e dígitos', () => {
    const id = gerarIdCertificado();
    const hash = id.split('-')[2];
    expect(hash).toMatch(/^[A-Z0-9]{8}$/);
  });
});

// ─── formatarDataEmissao ──────────────────────────────────────────────────────

describe('formatarDataEmissao()', () => {
  test('formata data no padrão DD/MM/AAAA', () => {
    const data = new Date(2025, 6, 15); // 15 de julho de 2025
    expect(formatarDataEmissao(data)).toBe('15/07/2025');
  });

  test('adiciona zero à esquerda para dia < 10', () => {
    const data = new Date(2025, 0, 5); // 5 de janeiro de 2025
    expect(formatarDataEmissao(data)).toBe('05/01/2025');
  });

  test('adiciona zero à esquerda para mês < 10', () => {
    const data = new Date(2025, 2, 20); // 20 de março de 2025
    expect(formatarDataEmissao(data)).toBe('20/03/2025');
  });

  test('retorna string com separadores /', () => {
    const resultado = formatarDataEmissao(new Date(2025, 11, 31));
    expect(resultado.split('/').length).toBe(3);
  });

  test('usa a data de hoje quando nenhuma data é passada', () => {
    const hoje = new Date();
    const esperado = formatarDataEmissao(hoje);
    const resultado = formatarDataEmissao();
    expect(resultado).toBe(esperado);
  });
});

// ─── gerarCompetenciasGenericas ───────────────────────────────────────────────

describe('gerarCompetenciasGenericas()', () => {
  test('retorna um array', () => {
    const competencias = gerarCompetenciasGenericas('Java');
    expect(Array.isArray(competencias)).toBe(true);
  });

  test('retorna pelo menos 5 competências', () => {
    const competencias = gerarCompetenciasGenericas('Java');
    expect(competencias.length).toBeGreaterThanOrEqual(5);
  });

  test('cada competência é uma string não vazia', () => {
    const competencias = gerarCompetenciasGenericas('Python');
    competencias.forEach((c) => {
      expect(typeof c).toBe('string');
      expect(c.length).toBeGreaterThan(0);
    });
  });

  test('menciona a tecnologia nas competências', () => {
    const competencias = gerarCompetenciasGenericas('Ruby');
    const textoCompleto = competencias.join(' ');
    expect(textoCompleto).toContain('Ruby');
  });
});

// ─── gerarCertificado ─────────────────────────────────────────────────────────

describe('gerarCertificado()', () => {
  // --- erros de entrada ---
  test('retorna erro para nome vazio', () => {
    const resultado = gerarCertificado('', 'Java');
    expect(resultado).toHaveProperty('erro');
    expect(resultado.erro).toContain('❌');
  });

  test('retorna erro para nome null', () => {
    const resultado = gerarCertificado(null, 'Java');
    expect(resultado).toHaveProperty('erro');
  });

  test('retorna erro para tecnologia vazia', () => {
    const resultado = gerarCertificado('João Silva', '');
    expect(resultado).toHaveProperty('erro');
  });

  test('retorna erro para tecnologia null', () => {
    const resultado = gerarCertificado('João Silva', null);
    expect(resultado).toHaveProperty('erro');
  });

  // --- certificado para Java (trilha encontrada no JSON) ---
  test('gera certificado válido para Java', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado).not.toHaveProperty('erro');
    expect(resultado).toHaveProperty('texto');
    expect(resultado).toHaveProperty('id');
    expect(resultado).toHaveProperty('trilhaNome');
  });

  test('certificado de Java contém o nome do usuário', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('João Silva');
  });

  test('certificado de Java contém a trilha correta', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('Formação Java Developer');
    expect(resultado.trilhaNome).toBe('Formação Java Developer');
  });

  test('certificado de Java contém o XP correto (18000)', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('18000');
  });

  test('certificado de Java contém a carga horária calculada (14×8=112h)', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('112 horas');
  });

  test('certificado de Java contém as badges da trilha', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('Java Starter');
    expect(resultado.texto).toContain('Java Master');
  });

  test('ID do certificado segue o formato DIO-AAAA-XXXXXXXX', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.id).toMatch(/^DIO-\d{4}-[A-Z0-9]{8}$/);
  });

  test('certificado contém a URL de verificação com o ID gerado', () => {
    const resultado = gerarCertificado('João Silva', 'Java', { id: 'DIO-2025-TESTID12' });
    expect(resultado.texto).toContain('https://www.dio.me/certificate/DIO-2025-TESTID12');
  });

  test('certificado usa data fornecida via opcoes', () => {
    const dataFixa = new Date(2025, 6, 15); // 15/07/2025
    const resultado = gerarCertificado('João Silva', 'Java', { data: dataFixa });
    expect(resultado.texto).toContain('15/07/2025');
  });

  test('certificado usa ID fornecido via opcoes', () => {
    const resultado = gerarCertificado('João Silva', 'Java', { id: 'DIO-2025-FIXED123' });
    expect(resultado.id).toBe('DIO-2025-FIXED123');
    expect(resultado.texto).toContain('DIO-2025-FIXED123');
  });

  // --- certificado para tecnologia inexistente no JSON ---
  test('gera certificado genérico para tecnologia não cadastrada', () => {
    const resultado = gerarCertificado('Maria Lima', 'COBOL');
    expect(resultado).not.toHaveProperty('erro');
    expect(resultado.texto).toContain('Maria Lima');
    expect(resultado.texto).toContain('COBOL');
  });

  test('trilhaNome genérico usa "Formação <tecnologia>"', () => {
    const resultado = gerarCertificado('Ana Costa', 'COBOL');
    expect(resultado.trilhaNome).toBe('Formação COBOL');
  });

  // --- nomes com caracteres especiais ---
  test('preserva acentos e maiúsculas no nome do usuário', () => {
    const resultado = gerarCertificado('Vítor Júnior', 'Python');
    expect(resultado.texto).toContain('Vítor Júnior');
  });

  // --- estrutura do markdown ---
  test('certificado contém cabeçalho DIO', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('CERTIFICADO DE CONCLUSÃO');
    expect(resultado.texto).toContain('Digital Innovation One');
  });

  test('certificado contém seção de competências', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('Competências Desenvolvidas');
  });

  test('certificado contém seção de badges conquistadas', () => {
    const resultado = gerarCertificado('João Silva', 'Java');
    expect(resultado.texto).toContain('Badges Conquistadas');
  });
});
