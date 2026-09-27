# /desafio

## Descrição
Gera um desafio de código aleatório e completo baseado na tecnologia e nível escolhidos pelo usuário.

## Uso
```
/desafio <tecnologia> <nível>
```

**Níveis aceitos:** `iniciante`, `intermediário`, `avançado`

**Exemplos:**
- `/desafio Python iniciante`
- `/desafio Java intermediário`
- `/desafio React avançado`
- `/desafio SQL iniciante`

---

## Comportamento

1. Identifique a **tecnologia** e o **nível** nos argumentos (busca case-insensitive; aceite variações como "basico", "básico", "beginner", "intermediate", "advanced").
2. Se o nível não for informado ou não for reconhecido, assuma **`intermediário`** como padrão e informe o usuário.
3. Se a tecnologia não for informada, retorne:
   > ❌ Informe a tecnologia. Exemplo: `/desafio Python iniciante`
4. Gere um desafio **aleatório** adequado ao nível — cada execução do mesmo comando deve poder produzir um desafio diferente.
5. Formate a resposta conforme o template abaixo.

---

## Níveis e Expectativas

| Nível         | Expectativa do Desafio                                                                 |
|---------------|----------------------------------------------------------------------------------------|
| **Iniciante** | Sintaxe básica, variáveis, condicionais, loops, funções simples, I/O                  |
| **Intermediário** | Estruturas de dados, algoritmos, POO, manipulação de arquivos, APIs simples        |
| **Avançado**  | Concorrência, design patterns, otimização, arquitetura, integração de sistemas        |

---

## Template de Resposta

```
# ⚔️ Desafio de Código — <Tecnologia> | Nível: <Nível>

---

## 📋 Enunciado

<Título curto do desafio — ex: "Calculadora de Fibonacci Otimizada">

<Descrição clara do problema em 3 a 6 linhas. Explique o contexto, o que deve ser feito e qual o objetivo final.>

---

## 📥 Entrada Esperada

<Descreva o formato da entrada: tipos, exemplos de valores, restrições>

**Exemplo de entrada:**
```
<exemplo de input>
```

---

## 📤 Saída Esperada

<Descreva o formato da saída>

**Exemplo de saída:**
```
<exemplo de output>
```

---

## ⚙️ Restrições e Regras

- <Restrição 1 — ex: "Não use bibliotecas externas">
- <Restrição 2 — ex: "A solução deve ter complexidade O(n)">
- <Restrição 3 — ex: "Trate casos de entrada inválida">

---

## 💡 Dicas

> 💭 <Dica 1 sem revelar a solução>
> 💭 <Dica 2, opcional>

---

## 🧩 Critérios de Avaliação

- [ ] O código resolve o problema corretamente
- [ ] O código trata os casos extremos (edge cases)
- [ ] O código está bem organizado e legível
- [ ] <Critério específico do nível — ex: "Utiliza a estrutura de dados adequada">

---

## 🏆 Recompensa ao Concluir

> +<XP entre 200 e 800, proporcional ao nível> XP • Badge desbloqueável: **<nome de badge temático>**

---

## 📚 Referências Úteis

- <Link ou referência à documentação oficial da tecnologia>
- <Recurso adicional relevante>
```

---

## Notas de Implementação

- Os desafios devem ser **variados a cada chamada** — nunca repita o mesmo enunciado para o mesmo par tecnologia/nível.
- A XP sugerida deve seguir esta escala:
  - Iniciante: 200–350 XP
  - Intermediário: 400–600 XP
  - Avançado: 650–800 XP
- O nome da badge deve ser criativo e temático (ex: "Fibonacci Master", "SQL Ninja", "Async Wizard").
- As restrições e dicas devem ser adequadas ao nível para não entregar a solução.
- Após gerar o desafio, convide o usuário a compartilhar a solução respondendo na conversa.
