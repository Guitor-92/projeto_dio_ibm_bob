#!/usr/bin/env node
/**
 * DIO Explorer MCP Server — transporte stdio (padrão Bob/Claude Desktop)
 *
 * Expõe 6 ferramentas:
 *   1. listar_trilhas      — lista todas as trilhas disponíveis
 *   2. buscar_trilha       — busca trilha por tecnologia e retorna plano de estudos
 *   3. gerar_desafio       — gera um desafio de código por tecnologia e nível
 *   4. emitir_certificado  — emite certificado de conclusão em Markdown
 *   5. listar_tecnologias  — lista as tecnologias disponíveis no catálogo
 *   6. consultar_progresso — consulta o histórico de progresso de um usuário
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

// ── Resolver caminhos para os módulos CJS da pasta ../src ──────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcPath = path.resolve(__dirname, '../../src');

// No Windows, import() dinâmico exige uma URL file:// — um caminho absoluto
// cru ("C:\...") é rejeitado pelo loader ESM com ERR_UNSUPPORTED_ESM_URL_SCHEME.
function importCjs(nomeArquivo: string): Promise<any> {
  return import(pathToFileURL(path.join(srcPath, nomeArquivo)).href);
}

// Importações dinâmicas dos módulos CommonJS do projeto principal
const { carregarTrilhas, buscarTrilha, formatarPlanoEstudos } = await importCjs('trilhas.js');
const { gerarDesafio } = await importCjs('desafio.js');
const { gerarCertificado } = await importCjs('certificados.js');
const {
  registrarTrilhaConsultada,
  registrarDesafioConcluido,
  registrarCertificadoEmitido,
  obterResumoProgresso,
  formatarResumoProgresso,
} = await importCjs('progresso.js');

// ── Instância do servidor ──────────────────────────────────────────────────
const server = new McpServer({
  name: 'dio-explorer',
  version: '1.0.0',
});

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 1 — listar_tecnologias
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'listar_tecnologias',
  {
    description:
      'Lista todas as tecnologias disponíveis no catálogo DIO, com nome da trilha e nível.',
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const trilhas = carregarTrilhas() as Array<{
        nome: string;
        tecnologia: string;
        nivel: string;
        xp_total: number;
      }>;
      const lista = trilhas
        .map((t) => `• ${t.tecnologia} — ${t.nome} (${t.nivel}) | ${t.xp_total} XP`)
        .join('\n');
      return {
        content: [
          {
            type: 'text' as const,
            text: `# Tecnologias disponíveis no DIO Explorer\n\n${lista}\n\nTotal: ${trilhas.length} trilhas`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro ao carregar trilhas: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 2 — listar_trilhas (com filtro opcional de nível)
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'listar_trilhas',
  {
    description:
      'Lista trilhas do catálogo DIO com informações resumidas. Aceita filtro opcional por nível.',
    inputSchema: z.object({
      nivel: z
        .enum(['Básico', 'Intermediário', 'Avançado', 'todos'])
        .optional()
        .default('todos')
        .describe('Filtrar por nível: Básico, Intermediário, Avançado, ou todos (padrão)'),
    }),
  },
  async ({ nivel }) => {
    try {
      const trilhas = carregarTrilhas() as Array<{
        id: number;
        nome: string;
        tecnologia: string;
        nivel: string;
        numero_de_modulos: number;
        xp_total: number;
        vitalicio: boolean;
        promocoes: { ativa: boolean; desconto_percentual: number };
      }>;

      const filtradas =
        nivel === 'todos'
          ? trilhas
          : trilhas.filter((t) =>
              t.nivel.toLowerCase().includes(nivel.toLowerCase())
            );

      if (filtradas.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Nenhuma trilha encontrada para o nível "${nivel}".`,
            },
          ],
        };
      }

      const lista = filtradas
        .map((t) => {
          const promo = t.promocoes.ativa
            ? ` 🏷️ ${t.promocoes.desconto_percentual}% OFF`
            : '';
          const vitStr = t.vitalicio ? '♾️ vitalício' : '⏳ acesso limitado';
          return `**[${t.id}] ${t.nome}**\n  Tecnologia: ${t.tecnologia} | Nível: ${t.nivel} | ${t.numero_de_modulos} módulos | ${t.xp_total} XP | ${vitStr}${promo}`;
        })
        .join('\n\n');

      return {
        content: [
          {
            type: 'text' as const,
            text: `# Trilhas DIO (${filtradas.length} resultados)\n\n${lista}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 3 — buscar_trilha
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'buscar_trilha',
  {
    description:
      'Busca uma trilha pelo nome da tecnologia e retorna o plano de estudos formatado com módulos, badges, lives e informações de acesso.',
    inputSchema: z.object({
      tecnologia: z
        .string()
        .min(1)
        .describe('Nome ou parte do nome da tecnologia. Ex: "Python", "Java", "AWS"'),
      nome_usuario: z
        .string()
        .optional()
        .describe('Opcional. Quando informado, registra a consulta no progresso do usuário.'),
    }),
  },
  async ({ tecnologia, nome_usuario }) => {
    try {
      const resultados = buscarTrilha(tecnologia) as unknown[];
      if (resultados.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `❌ Nenhuma trilha encontrada para "${tecnologia}".\n\nUse a ferramenta \`listar_tecnologias\` para ver as opções disponíveis.`,
            },
          ],
          isError: true,
        };
      }
      if (nome_usuario) {
        registrarTrilhaConsultada(nome_usuario, tecnologia);
      }
      const textos = (resultados as object[]).map((t) => formatarPlanoEstudos(t) as string);
      return {
        content: [
          {
            type: 'text' as const,
            text: textos.join('\n\n---\n\n'),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 4 — gerar_desafio
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'gerar_desafio',
  {
    description:
      'Gera um desafio de código aleatório para a tecnologia e nível escolhidos, com enunciado, exemplos, restrições, dicas e recompensa em XP.',
    inputSchema: z.object({
      tecnologia: z.string().min(1).describe('Tecnologia do desafio. Ex: "Java", "Python"'),
      nivel: z
        .enum(['iniciante', 'intermediário', 'avançado'])
        .optional()
        .default('intermediário')
        .describe('Nível do desafio: iniciante, intermediário (padrão) ou avançado'),
      nome_usuario: z
        .string()
        .optional()
        .describe('Opcional. Quando informado, registra o desafio e o XP no progresso do usuário.'),
    }),
  },
  async ({ tecnologia, nivel, nome_usuario }) => {
    try {
      const resultado = gerarDesafio(tecnologia, nivel) as
        | { texto: string; nivel: string; xp: number; badge: string }
        | { erro: string };

      if ('erro' in resultado) {
        return {
          content: [{ type: 'text' as const, text: resultado.erro }],
          isError: true,
        };
      }
      if (nome_usuario) {
        registrarDesafioConcluido(nome_usuario, tecnologia, resultado.nivel, resultado.xp);
      }
      return {
        content: [{ type: 'text' as const, text: resultado.texto }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 5 — emitir_certificado
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'emitir_certificado',
  {
    description:
      'Emite um certificado fictício de conclusão de trilha em Markdown com ID único, competências desenvolvidas, badges conquistadas e URL de verificação.',
    inputSchema: z.object({
      nome_usuario: z
        .string()
        .min(1)
        .describe('Nome completo do aluno. Ex: "João Silva"'),
      tecnologia: z
        .string()
        .min(1)
        .describe('Tecnologia ou nome da trilha concluída. Ex: "Java", "Python"'),
    }),
  },
  async ({ nome_usuario, tecnologia }) => {
    try {
      const resultado = gerarCertificado(nome_usuario, tecnologia) as
        | { texto: string; id: string; trilhaNome: string }
        | { erro: string };

      if ('erro' in resultado) {
        return {
          content: [{ type: 'text' as const, text: resultado.erro }],
          isError: true,
        };
      }
      registrarCertificadoEmitido(nome_usuario, tecnologia, resultado.id);
      return {
        content: [
          {
            type: 'text' as const,
            text: `${resultado.texto}\n\n---\n🔐 **ID:** \`${resultado.id}\`\n📚 **Trilha:** ${resultado.trilhaNome}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FERRAMENTA 6 — consultar_progresso
// ─────────────────────────────────────────────────────────────────────────────
server.registerTool(
  'consultar_progresso',
  {
    description:
      'Consulta o histórico de progresso de um usuário: trilhas consultadas, desafios concluídos, certificados emitidos e XP total acumulado.',
    inputSchema: z.object({
      nome_usuario: z
        .string()
        .min(1)
        .describe('Nome do usuário cujo progresso será consultado. Ex: "João Silva"'),
    }),
  },
  async ({ nome_usuario }) => {
    try {
      const resultado = obterResumoProgresso(nome_usuario) as
        | { registro: object }
        | { erro: string };

      if ('erro' in resultado) {
        return {
          content: [{ type: 'text' as const, text: resultado.erro }],
          isError: true,
        };
      }
      return {
        content: [
          { type: 'text' as const, text: formatarResumoProgresso(resultado.registro) as string },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: 'text' as const, text: `Erro: ${String(err)}` }],
        isError: true,
      };
    }
  }
);

// ── Inicialização ──────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[dio-explorer-mcp] Servidor MCP iniciado via stdio.');
}

main().catch((err) => {
  console.error('[dio-explorer-mcp] Erro fatal:', err);
  process.exit(1);
});
