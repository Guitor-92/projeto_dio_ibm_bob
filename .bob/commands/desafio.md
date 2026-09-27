---
description: Gera um desafio de código aleatório baseado em tecnologia e nível
argument-hint: <tecnologia> <iniciante|intermediário|avançado>
---

Gere um desafio de código para a tecnologia "$1" no nível "$2".

Se "$2" não for informado ou não for reconhecido como iniciante/intermediário/avançado (aceite variações: basico, básico, beginner, intermediate, advanced), use **intermediário** como padrão e avise o usuário.

Se "$1" não for informado, responda:
> ❌ Informe a tecnologia. Exemplo: `/desafio Python iniciante`

O desafio deve ser **diferente a cada execução** — varie o enunciado, contexto e casos de teste.

Use as seguintes expectativas por nível:
- **Iniciante:** sintaxe básica, variáveis, condicionais, loops, funções simples
- **Intermediário:** estruturas de dados, algoritmos, POO, manipulação de arquivos, APIs
- **Avançado:** concorrência, design patterns, otimização, arquitetura, integração de sistemas

---

Gere a resposta **exatamente** neste formato Markdown:

# ⚔️ Desafio de Código — $1 | Nível: $2

---

## 📋 Enunciado

**{Título curto e criativo do desafio}**

{Descrição clara do problema em 3 a 6 linhas. Explique o contexto e o objetivo final.}

---

## 📥 Entrada Esperada

{Descreva o formato da entrada, tipos e restrições.}

**Exemplo de entrada:**
```
{exemplo de input}
```

---

## 📤 Saída Esperada

{Descreva o formato da saída.}

**Exemplo de saída:**
```
{exemplo de output}
```

---

## ⚙️ Restrições e Regras

- {Restrição 1}
- {Restrição 2}
- {Restrição 3}

---

## 💡 Dicas

> 💭 {Dica 1 — sem revelar a solução}
> 💭 {Dica 2, se necessário}

---

## 🧩 Critérios de Avaliação

- [ ] O código resolve o problema corretamente
- [ ] Os casos extremos (edge cases) são tratados
- [ ] O código está bem organizado e legível
- [ ] {Critério específico para o nível $2}

---

## 🏆 Recompensa ao Concluir

> +{XP: 200–350 para iniciante / 400–600 para intermediário / 650–800 para avançado} XP • Badge: **{nome de badge temático e criativo}**

---

## 📚 Referências Úteis

- {Referência à documentação oficial de $1}
- {Recurso adicional relevante}

---

Responda ao final com:
> 🚀 Bora codar! Cole sua solução aqui para revisão ou use `/trilha $1` para ver o plano de estudos completo da tecnologia.
