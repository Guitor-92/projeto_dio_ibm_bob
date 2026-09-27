---
description: Exibe o plano de estudos formatado de uma trilha DIO pela tecnologia
argument-hint: <tecnologia>
---

Leia o arquivo `dio_explorer/data/trilhas_dio.json` e execute o seguinte:

1. Busque trilha(s) cujo campo `tecnologia` ou `nome` contenha "$1" (busca case-insensitive, parcial).

2. **Se nenhuma trilha for encontrada**, responda:
   > ❌ Nenhuma trilha encontrada para `$1`.
   >
   > 💡 Tecnologias disponíveis: Python, Java, React, Angular, Node.js, Amazon Web Services, Machine Learning, Git, Docker, SQL, TypeScript, Vue.js, Microsoft Azure, Flutter, Kotlin, Data Engineering, CyberSecurity, .NET, DevOps, LangChain, Golang, Rust, Figma, Blockchain, PHP, Power BI, Ruby, Swift, GCP, Qiskit.

3. **Para cada trilha encontrada**, gere o seguinte plano de estudos em Markdown:

---

# 🎓 Plano de Estudos — {nome da trilha}

**Tecnologia:** {tecnologia}  
**Nível:** {nivel}  
**Total de Módulos:** {numero_de_modulos}  
**XP Total ao Concluir:** {xp_total} XP

---

## 📚 Módulos da Trilha

Gere {numero_de_modulos} módulos com títulos realistas e progressivos para a tecnologia. Use o seguinte formato para cada módulo:

> **Módulo N — Título do Módulo**  
> 📌 Conteúdo principal: breve descrição do que é abordado  
> ⏱️ Carga estimada: X horas  
> 🏅 Badge desbloqueável: nome da badge (se houver nos últimos 30% dos módulos) ou —

---

## 🏅 Badges Disponíveis

Liste todas as badges em `badges_disponiveis` assim:

🥇 badge 1  
🥈 badge 2  
🥉 badge 3  
(e assim por diante)

---

## 🎥 Lives ao Vivo

Para cada item em `lives_ao_vivo`:

> 📅 **{titulo}**  
> 👤 Instrutor: {instrutor} | 🗓️ Data: {data}

---

## 💰 Informações de Acesso

- **Acesso vitalício:** Sim / Não (baseado no campo `vitalicio`)
- **Promoção ativa:** Se `promocoes.ativa` for true: "✅ {desconto_percentual}% de desconto — válido até {validade}" / Caso contrário: "❌ Sem promoção ativa no momento"

---

## 🚀 Próximos Passos

Finalize com uma mensagem motivacional de 2 linhas incentivando o aluno a iniciar a trilha e use o comando `/desafio $1 iniciante` para testar seus conhecimentos ao longo da jornada.
