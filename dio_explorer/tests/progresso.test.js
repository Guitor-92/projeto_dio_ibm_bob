'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  carregarProgresso,
  salvarProgresso,
  registrarTrilhaConsultada,
  registrarDesafioConcluido,
  registrarCertificadoEmitido,
  obterResumoProgresso,
  formatarResumoProgresso,
} = require('../src/progresso');

let caminhoTemp;

beforeEach(() => {
  caminhoTemp = path.join(os.tmpdir(), `dio-progresso-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
});

afterEach(() => {
  if (fs.existsSync(caminhoTemp)) fs.unlinkSync(caminhoTemp);
});

// ─── carregarProgresso ──────────────────────────────────────────────────────

describe('carregarProgresso()', () => {
  test('retorna estrutura vazia quando o arquivo não existe', () => {
    expect(carregarProgresso(caminhoTemp)).toEqual({ usuarios: {} });
  });

  test('retorna estrutura vazia quando o arquivo contém JSON inválido', () => {
    fs.writeFileSync(caminhoTemp, '{ isso não é json', 'utf-8');
    expect(carregarProgresso(caminhoTemp)).toEqual({ usuarios: {} });
  });

  test('retorna estrutura vazia quando o JSON não tem o formato esperado', () => {
    fs.writeFileSync(caminhoTemp, JSON.stringify({ foo: 'bar' }), 'utf-8');
    expect(carregarProgresso(caminhoTemp)).toEqual({ usuarios: {} });
  });

  test('carrega dados previamente salvos', () => {
    const dados = { usuarios: { joao: { nome: 'João', xpTotal: 100, trilhasConsultadas: [], desafiosConcluidos: [], certificados: [] } } };
    salvarProgresso(dados, caminhoTemp);
    expect(carregarProgresso(caminhoTemp)).toEqual(dados);
  });
});

// ─── salvarProgresso ────────────────────────────────────────────────────────

describe('salvarProgresso()', () => {
  test('cria o diretório de destino se não existir', () => {
    const subdir = path.join(os.tmpdir(), `dio-progresso-subdir-${Date.now()}`);
    const destino = path.join(subdir, 'progresso.json');
    salvarProgresso({ usuarios: {} }, destino);
    expect(fs.existsSync(destino)).toBe(true);
    fs.rmSync(subdir, { recursive: true, force: true });
  });
});

// ─── registrarTrilhaConsultada ──────────────────────────────────────────────

describe('registrarTrilhaConsultada()', () => {
  test('cria um novo registro de usuário na primeira consulta', () => {
    const resultado = registrarTrilhaConsultada('Maria', 'Python', { caminho: caminhoTemp });
    expect(resultado.registro.nome).toBe('Maria');
    expect(resultado.registro.trilhasConsultadas).toHaveLength(1);
    expect(resultado.registro.trilhasConsultadas[0].tecnologia).toBe('Python');
  });

  test('acumula múltiplas consultas para o mesmo usuário', () => {
    registrarTrilhaConsultada('Maria', 'Python', { caminho: caminhoTemp });
    const resultado = registrarTrilhaConsultada('Maria', 'Java', { caminho: caminhoTemp });
    expect(resultado.registro.trilhasConsultadas).toHaveLength(2);
  });

  test('é case-insensitive quanto à identidade do usuário', () => {
    registrarTrilhaConsultada('Maria', 'Python', { caminho: caminhoTemp });
    const resultado = registrarTrilhaConsultada('maria', 'Java', { caminho: caminhoTemp });
    expect(resultado.registro.trilhasConsultadas).toHaveLength(2);
  });

  test('retorna erro quando o usuário é vazio', () => {
    expect(registrarTrilhaConsultada('', 'Python', { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('retorna erro quando o usuário é null', () => {
    expect(registrarTrilhaConsultada(null, 'Python', { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('retorna erro quando a tecnologia é vazia', () => {
    expect(registrarTrilhaConsultada('Maria', '', { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('retorna erro quando a tecnologia é undefined', () => {
    expect(registrarTrilhaConsultada('Maria', undefined, { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('persiste a alteração em disco', () => {
    registrarTrilhaConsultada('Maria', 'Python', { caminho: caminhoTemp });
    expect(fs.existsSync(caminhoTemp)).toBe(true);
  });
});

// ─── registrarDesafioConcluido ──────────────────────────────────────────────

describe('registrarDesafioConcluido()', () => {
  test('registra o desafio e soma o XP', () => {
    const resultado = registrarDesafioConcluido('Ana', 'Java', 'avançado', 700, { caminho: caminhoTemp });
    expect(resultado.registro.desafiosConcluidos).toHaveLength(1);
    expect(resultado.registro.xpTotal).toBe(700);
  });

  test('acumula XP em múltiplos desafios', () => {
    registrarDesafioConcluido('Ana', 'Java', 'avançado', 700, { caminho: caminhoTemp });
    const resultado = registrarDesafioConcluido('Ana', 'Python', 'iniciante', 300, { caminho: caminhoTemp });
    expect(resultado.registro.xpTotal).toBe(1000);
    expect(resultado.registro.desafiosConcluidos).toHaveLength(2);
  });

  test('usa nível padrão "intermediário" quando não informado', () => {
    const resultado = registrarDesafioConcluido('Ana', 'Java', undefined, 500, { caminho: caminhoTemp });
    expect(resultado.registro.desafiosConcluidos[0].nivel).toBe('intermediário');
  });

  test('trata XP inválido (NaN) como zero', () => {
    const resultado = registrarDesafioConcluido('Ana', 'Java', 'avançado', NaN, { caminho: caminhoTemp });
    expect(resultado.registro.xpTotal).toBe(0);
  });

  test('trata XP não numérico como zero', () => {
    const resultado = registrarDesafioConcluido('Ana', 'Java', 'avançado', 'muito', { caminho: caminhoTemp });
    expect(resultado.registro.xpTotal).toBe(0);
  });

  test('retorna erro quando o usuário não é informado', () => {
    expect(registrarDesafioConcluido('', 'Java', 'avançado', 700, { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('retorna erro quando a tecnologia não é informada', () => {
    expect(registrarDesafioConcluido('Ana', '', 'avançado', 700, { caminho: caminhoTemp })).toHaveProperty('erro');
  });
});

// ─── registrarCertificadoEmitido ────────────────────────────────────────────

describe('registrarCertificadoEmitido()', () => {
  test('registra o certificado com o ID informado', () => {
    const resultado = registrarCertificadoEmitido('Pedro', 'Python', 'DIO-2025-ABC12345', { caminho: caminhoTemp });
    expect(resultado.registro.certificados).toHaveLength(1);
    expect(resultado.registro.certificados[0].id).toBe('DIO-2025-ABC12345');
  });

  test('aceita id ausente e usa null', () => {
    const resultado = registrarCertificadoEmitido('Pedro', 'Python', undefined, { caminho: caminhoTemp });
    expect(resultado.registro.certificados[0].id).toBeNull();
  });

  test('retorna erro quando o usuário não é informado', () => {
    expect(registrarCertificadoEmitido(undefined, 'Python', 'ID', { caminho: caminhoTemp })).toHaveProperty('erro');
  });

  test('retorna erro quando a tecnologia não é informada', () => {
    expect(registrarCertificadoEmitido('Pedro', '   ', 'ID', { caminho: caminhoTemp })).toHaveProperty('erro');
  });
});

// ─── obterResumoProgresso ───────────────────────────────────────────────────

describe('obterResumoProgresso()', () => {
  test('retorna registro vazio para usuário sem histórico', () => {
    const resultado = obterResumoProgresso('Novato', { caminho: caminhoTemp });
    expect(resultado.registro.xpTotal).toBe(0);
    expect(resultado.registro.trilhasConsultadas).toEqual([]);
    expect(resultado.registro.desafiosConcluidos).toEqual([]);
    expect(resultado.registro.certificados).toEqual([]);
  });

  test('retorna o histórico acumulado do usuário', () => {
    registrarTrilhaConsultada('Carlos', 'Go', { caminho: caminhoTemp });
    registrarDesafioConcluido('Carlos', 'Go', 'iniciante', 250, { caminho: caminhoTemp });
    registrarCertificadoEmitido('Carlos', 'Go', 'DIO-2025-XYZ', { caminho: caminhoTemp });

    const resultado = obterResumoProgresso('Carlos', { caminho: caminhoTemp });
    expect(resultado.registro.trilhasConsultadas).toHaveLength(1);
    expect(resultado.registro.desafiosConcluidos).toHaveLength(1);
    expect(resultado.registro.certificados).toHaveLength(1);
    expect(resultado.registro.xpTotal).toBe(250);
  });

  test('retorna erro quando o usuário não é informado', () => {
    expect(obterResumoProgresso('', { caminho: caminhoTemp })).toHaveProperty('erro');
  });
});

// ─── formatarResumoProgresso ────────────────────────────────────────────────

describe('formatarResumoProgresso()', () => {
  test('retorna string vazia quando o registro é nulo', () => {
    expect(formatarResumoProgresso(null)).toBe('');
  });

  test('formata mensagens padrão quando não há histórico', () => {
    const { registro } = obterResumoProgresso('Novato', { caminho: caminhoTemp });
    const texto = formatarResumoProgresso(registro);
    expect(texto).toContain('Nenhuma trilha consultada ainda');
    expect(texto).toContain('Nenhum desafio concluído ainda');
    expect(texto).toContain('Nenhum certificado emitido ainda');
  });

  test('inclui tecnologia e XP no texto formatado', () => {
    registrarDesafioConcluido('Lia', 'Rust', 'avançado', 650, { caminho: caminhoTemp });
    const { registro } = obterResumoProgresso('Lia', { caminho: caminhoTemp });
    const texto = formatarResumoProgresso(registro);
    expect(texto).toContain('Rust');
    expect(texto).toContain('650 XP');
    expect(texto).toContain('XP Total Acumulado:** 650 XP');
  });

  test('lista trilhas consultadas no texto formatado', () => {
    registrarTrilhaConsultada('Lia', 'Rust', { caminho: caminhoTemp });
    const { registro } = obterResumoProgresso('Lia', { caminho: caminhoTemp });
    const texto = formatarResumoProgresso(registro);
    expect(texto).toContain('- Rust');
  });

  test('lista múltiplos certificados no texto formatado', () => {
    registrarCertificadoEmitido('Lia', 'Rust', 'DIO-2025-AAA', { caminho: caminhoTemp });
    registrarCertificadoEmitido('Lia', 'Go', 'DIO-2025-BBB', { caminho: caminhoTemp });
    const { registro } = obterResumoProgresso('Lia', { caminho: caminhoTemp });
    const texto = formatarResumoProgresso(registro);
    expect(texto).toContain('DIO-2025-AAA');
    expect(texto).toContain('DIO-2025-BBB');
  });
});
