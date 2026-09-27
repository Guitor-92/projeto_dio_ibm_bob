# DIO Explorer

Projeto de portfólio desenvolvido para o desafio **"Construindo Seu Primeiro Produto com um Agente de IA"** (DIO), usando o **IBM Bob** como agente de desenvolvimento de ponta a ponta.

## O que é

O DIO Explorer simula uma plataforma de educação tecnológica (inspirada na DIO — Digital Innovation One). A pessoa usuária pode:

- **Consultar uma trilha** de estudos por tecnologia (`/trilha`)
- **Receber um desafio de código** por tecnologia e nível (`/desafio`)
- **Gerar um certificado fictício** de conclusão (`/certificados`)

Tudo isso a partir de uma base de 30 trilhas fictícias (`dio_explorer/data/trilhas_dio.json`), com lógica de negócio testada (159 testes, 100% de cobertura) e exposta também via **servidor MCP** (stdio + HTTP/HTTPS) e via **interface web**, para que outras ferramentas, agentes ou pessoas possam consumir os mesmos recursos. Cada ação pode opcionalmente ser associada a um nome de usuário, cujo **progresso** (trilhas consultadas, desafios concluídos, XP acumulado, certificados emitidos) fica registrado e consultável.

## Como executar o projeto

```bash
cd dio_explorer
npm install
npm test          # roda a suíte de testes com cobertura
```

Para a interface web (opcional — front-end que consome a mesma lógica testada):

```bash
cd dio_explorer
npm run web              # sobe em http://localhost:4000
```

Para o servidor MCP (opcional — expõe os recursos via stdio ou HTTP):

```bash
cd dio_explorer/mcp
npm install
npm run build
node build/index.js     # modo stdio (Bob / Claude Desktop)
node build/http.js      # modo HTTP (API REST) — detalhes em dio_explorer/mcp/README.md
```

## Como usar os comandos

Os comandos ficam disponíveis como slash commands do Bob (`.bob/commands/`):

```bash
/trilha Python
/desafio Java intermediário
/certificados João Silva Python
```

Detalhes de cada comando (sintaxe, exemplos, aliases de nível) estão documentados em [`dio_explorer/docs/README.md`](dio_explorer/docs/README.md#4-slash-commands--modos-de-uso).

## Como executar os testes

```bash
cd dio_explorer
npm test              # cobertura resumida
npm run test:verbose  # saída detalhada por teste
```

Resultado atual: **159/159 testes passando** (unitários + integração), com 100% de cobertura em statements, functions e lines nos módulos de `src/` (meta configurada era 70%). Relatório original em [`dio_explorer/docs/test-results.txt`](dio_explorer/docs/test-results.txt).

Além dos testes unitários, há testes de integração que sobem os servidores de verdade (não mocks) e falam com eles pela rede — `dio_explorer/tests/integration/web.test.js` (roda junto com `npm test`) e `dio_explorer/mcp/tests/http.integration.test.mjs` (roda com `cd dio_explorer/mcp && npm run build && npm run test:integration`).

## Melhorias realizadas além do escopo mínimo

- **Servidor MCP completo** (não só stdio): transporte HTTP/HTTPS com autenticação via API Key estática ou JWT HS256, para acesso remoto/SSO por qualquer cliente REST.
- **Interface web** (`dio_explorer/web/`): front-end em HTML/CSS/JS puro (sem framework/bundler) consumindo a mesma lógica de negócio já testada em `src/`, via uma API REST fina servida por um servidor HTTP com zero dependências externas.
- **Progresso do aluno** (`dio_explorer/src/progresso.js`): histórico persistido por usuário — trilhas consultadas, desafios concluídos, XP acumulado e certificados emitidos —, disponível na interface web (aba "Progresso"), como 6ª ferramenta do MCP (`consultar_progresso`) e opt-in nas demais ferramentas via parâmetro `nome_usuario`.
- **Testes de integração ponta a ponta**: além da cobertura unitária de 100%, os servidores web e MCP HTTP são testados como processos reais (não mocks), pela rede — o que já achou e corrigiu um bug real de compatibilidade com Windows nas importações do servidor MCP (`ERR_UNSUPPORTED_ESM_URL_SCHEME`).
- **Cobertura de testes de 100%**, bem acima da meta de 70% definida no projeto.
- **Documentação técnica estendida** em [`dio_explorer/docs/README.md`](dio_explorer/docs/README.md), incluindo arquitetura, prompts usados na construção do projeto e insights de desenvolvimento com IA.

## O que foi aprendido durante o desafio

- A qualidade do resultado gerado por um agente de IA é proporcional à clareza do prompt: pedidos vagos geram código vago, enquanto especificar entradas, saídas e casos de erro produz código pronto para teste.
- Separar a lógica de negócio (`src/`) da camada de entrega (slash commands, MCP) permitiu reutilizar o mesmo código testado em contextos diferentes sem duplicação.
- Testes escritos junto com a implementação funcionam como especificação executável do comportamento esperado — e pegam regressões antes de virar bug em produção.
- O protocolo MCP é uma camada de integração universal: o mesmo servidor consumido via stdio pelo Bob pode ser exposto como API HTTP para qualquer outro sistema, sem duplicar lógica.
- Cobertura de testes unitários de 100% não é o mesmo que "funciona quando roda de verdade": um bug de compatibilidade com Windows nas importações dinâmicas do servidor MCP só apareceu ao subir o processo real e testar pela rede — nenhum dos testes unitários (nem a cobertura de 100%) o detectou.

## Estrutura do repositório

Ver detalhamento completo em [`dio_explorer/docs/README.md`](dio_explorer/docs/README.md#2-arquitetura-do-projeto).

```
.
├── .bob/                # slash commands e registro do MCP no Bob
└── dio_explorer/
    ├── data/             # base de trilhas fictícias (JSON) + cache de progresso (gitignored)
    ├── src/              # lógica de negócio (trilhas, desafios, certificados, progresso)
    ├── tests/            # testes unitários Jest + tests/integration/ (servidor web real)
    ├── mcp/              # servidor MCP (TypeScript) — stdio e HTTP/HTTPS + tests/ (protocolo real)
    ├── web/              # interface web (HTML/CSS/JS puro + API REST)
    └── docs/             # documentação técnica detalhada
```
