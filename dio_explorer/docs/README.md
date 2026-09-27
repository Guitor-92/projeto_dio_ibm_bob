# DIO Explorer — Documentação Completa do Projeto

> Guia de referência para desenvolvedores: arquitetura, prompts usados, modos de uso, testes, MCP Server e insights para quem quer aprender construindo com IA.

---

## Índice

1. [O que é o DIO Explorer](#1-o-que-é-o-dio-explorer)
2. [Arquitetura do projeto](#2-arquitetura-do-projeto)
3. [Prompts usados para construir o projeto](#3-prompts-usados-para-construir-o-projeto)
4. [Slash Commands — modos de uso](#4-slash-commands--modos-de-uso)
5. [Biblioteca de lógica (src/)](#5-biblioteca-de-lógica-src)
6. [Testes unitários](#6-testes-unitários)
7. [MCP Server](#7-mcp-server)
8. [Configuração e deploy](#8-configuração-e-deploy)
9. [Insights para futuros profissionais](#9-insights-para-futuros-profissionais)
10. [Dicas avançadas de uso com IA](#10-dicas-avançadas-de-uso-com-ia)

---

## 1. O que é o DIO Explorer

O **DIO Explorer** é um projeto de demonstração construído inteiramente com auxílio do **IBM Bob** como agente de desenvolvimento. Ele simula funcionalidades de uma plataforma de educação tecnológica (inspirada na DIO — Digital Innovation One) e serve como laboratório prático de:

| Componente | Descrição |
|---|---|
| 🗂️ Catálogo de Trilhas | 30 trilhas em JSON com módulos, badges, lives e promoções |
| ⚔️ Geração de Desafios | Desafios de código por nível com enunciado, entrada/saída e recompensa em XP |
| 🎓 Certificados | Certificados fictícios em Markdown com ID único e badges conquistadas |
| 🔌 MCP Server | 6 ferramentas via stdio, HTTP e HTTPS com autenticação |
| 📈 Progresso do aluno | Histórico persistido de trilhas, desafios e certificados, com XP acumulado |
| 🖥️ Interface Web | Front-end HTML/CSS/JS puro consumindo a mesma lógica testada via API REST |
| ✅ Testes Unitários | 159 testes Jest com 100% de cobertura de statements, functions e lines |
| ✅ Testes de Integração | Servidor web e servidor MCP HTTP testados como processos reais, via rede |
| 💬 Slash Commands | 3 comandos nativos do Bob: `/trilha`, `/desafio`, `/certificados` |

---

## 2. Arquitetura do projeto

```
projeto_dio_ibm_bob/
├── .bob/
│   ├── commands/                  # Slash commands registrados no Bob
│   │   ├── trilha.md              # /trilha <tecnologia>
│   │   ├── desafio.md             # /desafio <tecnologia> <nível>
│   │   └── certificados.md        # /certificados <nome> <trilha>
│   └── mcp.json                   # Registro do MCP Server no Bob
├── .gitignore                     # Boas práticas — 10 seções
├── .bobignore
└── dio_explorer/
    ├── data/
    │   ├── trilhas_dio.json       # 30 trilhas com todos os metadados
    │   └── cache-progresso/       # Histórico de progresso por usuário (gitignored)
    │       └── progresso.json
    ├── src/                       # Lógica de negócio (CommonJS, sem dependências externas)
    │   ├── trilhas.js             # busca, cálculo de carga horária, formatação
    │   ├── desafio.js             # geração de desafios por nível e tecnologia
    │   ├── certificados.js        # emissão de certificados com ID único
    │   └── progresso.js           # histórico de progresso por usuário (trilhas, desafios, XP, certificados)
    ├── tests/                     # Testes unitários Jest
    │   ├── trilha.test.js         # 37 testes
    │   ├── desafio.test.js        # 43 testes
    │   ├── certificados.test.js   # 35 testes
    │   ├── progresso.test.js      # 32 testes
    │   └── integration/
    │       └── web.test.js        # 12 testes — sobe web/server.js como processo real
    ├── web/                       # Interface web (HTML/CSS/JS puro + API REST)
    │   ├── server.js               # servidor HTTP nativo, reaproveita src/*.js
    │   └── public/                 # index.html, style.css, app.js
    ├── mcp/                       # MCP Server (TypeScript ESM)
    │   ├── tests/
    │   │   └── http.integration.test.mjs  # 6 testes — protocolo MCP real via SDK oficial
    │   ├── src/
    │   │   ├── index.ts           # Transporte stdio (Bob / Claude Desktop)
    │   │   ├── http.ts            # Transporte HTTP/HTTPS (acesso remoto / SSO)
    │   │   └── auth.ts            # Middleware: API Key + JWT HS256
    │   ├── build/                 # JS compilado (gerado por npm run build)
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── README.md
    ├── commands/                  # Documentação detalhada dos slash commands
    ├── docs/
    │   └── test-results.txt       # Relatório de testes + artefatos gerados
    └── package.json               # Jest 29, threshold 70%
```

### Fluxo de dados

```
trilhas_dio.json
      │
      ▼
  src/trilhas.js ──────────────────────────────────────────────┐
  src/desafio.js                                               │ consumido por
  src/certificados.js                                          │
      │                                                        ▼
      ├── .bob/commands/      ← slash commands (IA responde diretamente)
      │
      └── mcp/src/index.ts   ← stdio  → Bob / Claude Desktop
          mcp/src/http.ts    ← HTTP   → qualquer cliente REST / SSO
```

---

## 3. Prompts usados para construir o projeto

Todo o projeto foi construído com 5 prompts principais, na ordem abaixo. A qualidade do prompt determina diretamente a qualidade do resultado.

### Prompt 1 — Slash commands

```
Bob crie agora um slash command chamado /trilha que recebe o nome de uma tecnologia
e retorna, a partir do arquivo data/trilhas_dio.json um plano de estudos formatado
com os módulos daquela trilha. Depois, crie outro slash command chamado /desafio que
gera um desafio de código aleatório baseado no nível e tecnologia escolhido pelo
usuário, E por fim um último slash command chamado /certificados que gera um
certificado fictício em markdown com o nome do usuário e a trilha por ele concluída.
```

**Resultado:** 3 arquivos `.md` em `.bob/commands/` com frontmatter correto (`description`, `argument-hint`), instruções de comportamento e templates de resposta Markdown.

---

### Prompt 2 — Teste do slash command

```
/trilha Python
```

**Resultado:** Plano de estudos completo da trilha Python com 12 módulos progressivos, badges, lives ao vivo, promoção ativa (30% OFF) e mensagem motivacional.

---

### Prompt 3 — Testes unitários e artefatos

```
Bob crie arquivos de testes unitarios e teste este fluxo para atingir uma cobertura
de 70% de aprovação. teste os conjuntos /trilha para consultar trilhas de java.
gere um arquivo de /desafio para o aluno e um certificado para o mesmo.
Grave os resultados em um arquivo txt para acompanharmos.
```

**Resultado:** Projeto Node.js com Jest 29, 3 módulos de lógica em `src/`, 115 testes, relatório completo em `docs/test-results.txt`. Meta de 70% superada: **100% de cobertura**.

---

### Prompt 4 — .gitignore

```
Bob, crie o arquivo .gitignore também com as boas práticas de desenvolvimento
para não subir arquivos desnecessários no repositório.
```

**Resultado:** `.gitignore` na raiz com 10 seções cobrindo dependências, build, cobertura, segredos, logs, cache, temporários, SO, IDEs e dados de runtime do projeto.

---

### Prompt 5 — MCP Server

```
Bob, quero que você crie um MCP Server do projeto recém clonado para que futuramente
pessoas possam vir acessar por meio de um servidor https ou sso ou via API.
Use a pasta mcp para isso.
```

**Resultado:** Servidor MCP completo em TypeScript com 5 ferramentas, transporte stdio, transporte HTTP/HTTPS, middleware de autenticação (API Key + JWT HS256), build sem erros e registro em `.bob/mcp.json`.

---

## 4. Slash Commands — modos de uso

Os três comandos ficam disponíveis digitando `/` na barra de chat do Bob.

### /trilha \<tecnologia\>

Busca case-insensitive e parcial nos campos `tecnologia` e `nome` do JSON.

```bash
/trilha Python
/trilha java              # case-insensitive
/trilha AWS               # busca parcial em tecnologia
/trilha Formação React    # busca no nome da trilha
/trilha SQL               # encontra "Formação SQL e Banco de Dados"
```

**Saída:** plano de estudos com módulos numerados e progressivos, badges, lives ao vivo, promoções ativas e informações de acesso vitalício.

> 💡 Use termos parciais. `/trilha docker` encontra "Formação Docker e Kubernetes".

---

### /desafio \<tecnologia\> \<nível\>

Gera desafio aleatório. Se o nível for omitido ou inválido, usa `intermediário` como padrão.

```bash
/desafio Python iniciante
/desafio Java intermediário
/desafio React avançado
/desafio SQL beginner      # alias em inglês funciona
/desafio Go                # sem nível → intermediário
```

| Nível | XP | Conteúdo esperado |
|---|---|---|
| iniciante | 200–350 | Sintaxe, variáveis, condicionais, loops |
| intermediário | 400–600 | Estruturas de dados, POO, APIs |
| avançado | 650–800 | Concorrência, design patterns, arquitetura |

> 💡 Execute o mesmo comando várias vezes — o desafio é aleatório a cada chamada.

---

### /certificados \<nome\> \<trilha\>

Gera certificado Markdown com ID único `DIO-2025-XXXXXXXX`. Se a trilha não for encontrada no JSON, gera certificado genérico plausível.

```bash
/certificados João Silva Python
/certificados Maria Oliveira React
/certificados Ana Costa Machine Learning
/certificados Pedro AWS          # nome curto funciona
```

> 💡 O certificado gerado está em Markdown puro — copie e cole em um `.md`, no GitHub README ou no Notion.

---

## 5. Biblioteca de lógica (src/)

Módulos CommonJS sem dependências externas, testáveis isoladamente.

### src/trilhas.js

| Função | Parâmetros | Retorno |
|---|---|---|
| `carregarTrilhas()` | — | Array com as 30 trilhas do JSON |
| `buscarTrilha(tecnologia)` | string | Array de trilhas correspondentes |
| `calcularCargaHoraria(trilha)` | objeto | número (módulos × 8h) |
| `formatarPromocao(trilha)` | objeto | string com ✅ ou ❌ |
| `formatarPlanoEstudos(trilha)` | objeto | string Markdown com plano completo |

### src/desafio.js

| Função | Parâmetros | Retorno |
|---|---|---|
| `normalizarNivel(nivel)` | string | `"iniciante"` \| `"intermediário"` \| `"avançado"` |
| `xpAleatorio(min, max)` | number, number | inteiro aleatório no intervalo |
| `itemAleatorio(arr)` | array | item aleatório ou null |
| `gerarDesafio(tecnologia, nivel)` | string, string | `{ texto, nivel, xp, badge }` ou `{ erro }` |

### src/certificados.js

| Função | Parâmetros | Retorno |
|---|---|---|
| `gerarIdCertificado(ano?)` | number opcional | string `"DIO-AAAA-XXXXXXXX"` |
| `formatarDataEmissao(data?)` | Date opcional | string `"DD/MM/AAAA"` |
| `gerarCompetenciasGenericas(tecnologia)` | string | array de 5 competências |
| `gerarCertificado(nome, tecnologia, opcoes?)` | string, string, object | `{ texto, id, trilhaNome }` ou `{ erro }` |

### src/progresso.js

| Função | Parâmetros | Retorno |
|---|---|---|
| `carregarProgresso(caminho?)` | string opcional | `{ usuarios: Object }` |
| `salvarProgresso(dados, caminho?)` | object, string opcional | — (persiste em disco) |
| `registrarTrilhaConsultada(usuario, tecnologia, opcoes?)` | string, string, object | `{ registro }` ou `{ erro }` |
| `registrarDesafioConcluido(usuario, tecnologia, nivel, xp, opcoes?)` | string, string, string, number, object | `{ registro }` ou `{ erro }` (soma XP acumulado) |
| `registrarCertificadoEmitido(usuario, tecnologia, certificadoId, opcoes?)` | string, string, string, object | `{ registro }` ou `{ erro }` |
| `obterResumoProgresso(usuario, opcoes?)` | string, object | `{ registro }` ou `{ erro }` |
| `formatarResumoProgresso(registro)` | object | string Markdown com o resumo do progresso |

Persiste em `data/cache-progresso/progresso.json` (caminho já reservado no `.gitignore` original do projeto — dado de runtime, não de fonte). Identidade do usuário é case-insensitive (`"Maria"` e `"maria"` acumulam no mesmo registro).

---

## 6. Testes unitários e de integração

### Resultado final — testes unitários (Jest)

| Suite | Testes | Status |
|---|---|---|
| `trilha.test.js` | 37 | ✅ PASS |
| `desafio.test.js` | 43 | ✅ PASS |
| `certificados.test.js` | 35 | ✅ PASS |
| `progresso.test.js` | 32 | ✅ PASS |
| `integration/web.test.js` | 12 | ✅ PASS |
| **TOTAL** | **159** | ✅ **159/159** |

### Cobertura (src/)

| Arquivo | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| certificados.js | 100% | 100% | 100% | 100% |
| desafio.js | 100% | 100% | 100% | 100% |
| progresso.js | 100% | 90.62% | 100% | 100% |
| trilhas.js | 100% | 95.65% | 100% | 100% |
| **TOTAL** | **100%** | **94.96%** | **100%** | **100%** |

> Meta configurada: **70%** em todas as métricas. Resultado: superada em todas as dimensões.

### Testes de integração (fora do Jest, contra processos reais)

Cobertura unitária de 100% prova que cada função isolada se comporta como esperado — **não** prova que o processo sobe, escuta na porta certa e fala o protocolo direito. Os dois testes abaixo cobrem exatamente essa lacuna: sobem o binário real (não importam funções internas) e conversam com ele pela rede.

| Onde | O que testa | Como rodar |
|---|---|---|
| `dio_explorer/tests/integration/web.test.js` | Sobe `web/server.js` como child process e bate em todos os endpoints REST via `fetch`, incluindo o fluxo completo de progresso (trilha → desafio → certificado → `/api/progresso`) | Roda junto com `npm test` (Jest) |
| `dio_explorer/mcp/tests/http.integration.test.mjs` | Sobe `build/http.js` como child process e fala o protocolo MCP real via `@modelcontextprotocol/sdk/client` (handshake, `tools/list`, `tools/call` nas 6 ferramentas) e valida a autenticação por API Key com um servidor real (requisição sem token → 401, com token → 200) | `cd mcp && npm run build && npm run test:integration` |

> Esses testes já pegaram um bug real durante o desenvolvimento: no Windows, `import()` dinâmico com um caminho absoluto cru (`C:\...`) é rejeitado pelo loader ESM do Node (`ERR_UNSUPPORTED_ESM_URL_SCHEME`) — só apareceu ao rodar o servidor de verdade, nenhum teste unitário o pegaria. Corrigido convertendo os caminhos com `pathToFileURL()` antes do `import()`.

### Como rodar

```bash
cd dio_explorer

# Testes unitários + integração web, com cobertura (modo padrão)
npm test

# Com saída detalhada por teste
npm run test:verbose

# Testes de integração do servidor MCP HTTP (requer build atualizado)
cd mcp && npm run build && npm run test:integration
```

### Padrões de teste aplicados

- **Happy path:** testa o caso principal com dados reais do JSON
- **Edge cases:** `null`, `undefined`, string vazia, espaços, tipos errados
- **Propriedades:** verifica que campos do JSON existem com valores corretos
- **Aleatoriedade:** executa funções aleatórias em loop e valida intervalos
- **Formato:** valida formatos com regex (ex: `/^DIO-\d{4}-[A-Z0-9]{8}$/`)

---

## 7. MCP Server

### As 6 ferramentas

| Tool | Input | O que faz |
|---|---|---|
| `listar_tecnologias` | — | Retorna as 30 tecnologias com trilha, nível e XP |
| `listar_trilhas` | `nivel?` | Lista trilhas com filtro opcional por nível |
| `buscar_trilha` | `tecnologia, nome_usuario?` | Plano de estudos completo da trilha |
| `gerar_desafio` | `tecnologia, nivel?, nome_usuario?` | Desafio de código com XP e badge |
| `emitir_certificado` | `nome_usuario, tecnologia` | Certificado Markdown com ID único |
| `consultar_progresso` | `nome_usuario` | Histórico de trilhas, desafios, certificados e XP total |

> O parâmetro opcional `nome_usuario` em `buscar_trilha` e `gerar_desafio` registra a ação no progresso do usuário (mesmo mecanismo usado automaticamente por `emitir_certificado`). Sem ele, as ferramentas funcionam normalmente — o registro é opt-in.

### Modo stdio — Bob (já configurado)

```json
// .bob/mcp.json
{
  "mcpServers": {
    "dio-explorer": {
      "command": "node",
      "args": ["...dio_explorer/mcp/build/index.js"]
    }
  }
}
```

### Modo HTTP

```bash
# Desenvolvimento (sem autenticação — aviso no log)
node dio_explorer/mcp/build/http.js

# Produção com API Key
DIO_MCP_API_KEY=minha-chave node dio_explorer/mcp/build/http.js

# Produção com HTTPS + JWT/SSO
DIO_MCP_TLS_CERT=/etc/ssl/cert.pem \
DIO_MCP_TLS_KEY=/etc/ssl/key.pem  \
DIO_MCP_JWT_SECRET=meu-secret-hs256 \
node dio_explorer/mcp/build/http.js
```

### Autenticação

| Mecanismo | Variável | Header |
|---|---|---|
| API Key estática | `DIO_MCP_API_KEY` | `Authorization: Bearer <key>` |
| JWT HS256 / SSO | `DIO_MCP_JWT_SECRET` | `Authorization: Bearer <token>` |
| Sem auth (dev) | Nenhuma | Aviso no log — não use em produção |

### Rebuild após alterações

```bash
cd dio_explorer/mcp
npm run build
```

---

## 8. Configuração e deploy

### Primeira execução

```bash
# 1. Instalar dependências do projeto principal (testes)
cd dio_explorer
npm install

# 2. Rodar os testes
npm test

# 3. Instalar dependências do MCP Server
cd mcp
npm install
npm run build
```

### Variáveis de ambiente do MCP HTTP

| Variável | Padrão | Descrição |
|---|---|---|
| `DIO_MCP_PORT` | 3000 | Porta HTTP |
| `DIO_MCP_HOST` | 0.0.0.0 | Interface de rede |
| `DIO_MCP_TLS_CERT` | — | Certificado TLS .pem → ativa HTTPS |
| `DIO_MCP_TLS_KEY` | — | Chave privada TLS .pem |
| `DIO_MCP_API_KEY` | — | Chave API Bearer estática |
| `DIO_MCP_JWT_SECRET` | — | Secret HMAC-HS256 para JWT/SSO |
| `DIO_MCP_CORS_ORIGINS` | `*` | Origens CORS permitidas (vírgula) |

> ⚠️ Configure ao menos `DIO_MCP_API_KEY` ou `DIO_MCP_JWT_SECRET` antes de expor o servidor na internet.

---

## 9. Insights para futuros profissionais

### 1. IA como par de desenvolvimento, não substituição

O Bob não "escreveu o projeto sozinho" — ele respondeu a prompts precisos. A qualidade do resultado é proporcional à clareza do problema descrito. Prompts vagos geram código vago; prompts com contexto, exemplos e restrições geram código de produção.

### 2. Separação de responsabilidades é ainda mais importante com IA

Os módulos `src/trilhas.js`, `src/desafio.js` e `src/certificados.js` têm zero acoplamento entre si. Isso permitiu testar cada um isoladamente e reutilizá-los em contextos diferentes (slash commands, MCP, testes) sem modificação.

### 3. Testes unitários validam o entendimento da IA

Os 115 testes foram escritos como especificação do comportamento esperado — cada `expect` documenta um contrato. Se a IA gerar código que quebra esse contrato em uma refatoração futura, os testes acusam imediatamente.

### 4. MCP Server como camada de integração universal

O mesmo servidor que o Bob consome via stdio pode ser exposto como API REST para qualquer sistema. O protocolo MCP é uma interface padronizada entre ferramentas e modelos de linguagem — entendê-lo é vantagem competitiva crescente no mercado de IA.

### 5. Slash commands são prompts reutilizáveis com parâmetros

Um arquivo `.md` em `.bob/commands/` funciona como uma "função de prompt". O frontmatter define o hint de argumento; o corpo define o comportamento. É código de alto nível — instrui a IA como um ser humano instruiria um colega.

### 6. TypeScript no MCP, JavaScript no core

O core (`src/`) usa CommonJS sem tipagem para manter zero dependências e máxima portabilidade. O MCP Server usa TypeScript ESM porque precisa da tipagem para o SDK MCP e Zod. Essa divisão consciente evita complexidade desnecessária no módulo mais simples.

### 7. .gitignore como política de segurança

Nunca suba `.env`, chaves TLS (`.pem`, `.key`) ou `node_modules/`. O `.gitignore` deste projeto cobre todos esses casos — use-o como template em qualquer projeto Node.js.

### 8. JWT HS256 vs OAuth/OIDC

O `auth.ts` implementa validação JWT HS256 com `crypto.subtle` nativo do Node.js 18 — sem dependências externas. Para produção com múltiplos IdPs (Keycloak, Auth0, Azure AD), substitua pela verificação via JWKS URI do IdP. A interface (`authenticate(req) → AuthResult`) não muda.

---

## 10. Dicas avançadas de uso com IA

### Como escrever prompts que geram código de qualidade

| Antipadrão | Padrão recomendado |
|---|---|
| "Crie um sistema de trilhas" | "Crie `src/trilhas.js` que exporte `buscarTrilha(tecnologia)` com busca case-insensitive e parcial no JSON." |
| "Faça testes" | "Crie testes Jest para `buscarTrilha()` cobrindo: busca exata, parcial, case-insensitive, string vazia, null, tecnologia inexistente." |
| "Adicione autenticação" | "Adicione middleware em `auth.ts` para API Key via `Authorization: Bearer` lida de `DIO_MCP_API_KEY` e JWT HS256 via `DIO_MCP_JWT_SECRET`. Sem dependências externas." |

### Fluxo de trabalho recomendado

1. **Explore antes de criar.** Peça ao Bob para ler os arquivos existentes antes de escrever código.
2. **Especifique entradas e saídas.** Descreva o que cada função recebe e retorna — incluindo casos de erro.
3. **Peça testes junto com o código.** Teste e implementação no mesmo contexto garantem cobertura real.
4. **Valide incrementalmente.** Rode os testes após cada módulo, não só no final.
5. **Use o todo list.** Para tarefas longas, o Bob mantém um checklist visível de progresso.

### Extensões já implementadas

| Ideia | Onde |
|---|---|
| ✅ Persistir progresso do aluno | `src/progresso.js` + tool `consultar_progresso` no MCP + aba "Progresso" na interface web |
| ✅ Interface web | `web/server.js` + `web/public/` — HTML/CSS/JS puro, sem framework, consumindo `src/*.js` via API REST fina |
| ✅ Testes de integração ponta-a-ponta | `tests/integration/web.test.js` e `mcp/tests/http.integration.test.mjs` — sobem os processos reais e falam com eles pela rede |

### Próximas extensões sugeridas

| Ideia | Caminho sugerido |
|---|---|
| Mais desafios por tecnologia | Expandir o objeto `DESAFIOS` em `src/desafio.js` |
| API REST completa | Adicionar Express ao `mcp/src/http.ts` com rotas `/trilhas`, `/desafio`, `/certificado` |
| Auth com Keycloak/Auth0 | Substituir validação manual em `auth.ts` pelo JWKS URI do IdP |
| Banco de dados | Migrar `trilhas_dio.json` (e `progresso.json`) para SQLite/PostgreSQL com Prisma |

---

*Documentação gerada com IBM Bob — 2025*
