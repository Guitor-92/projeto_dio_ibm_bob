---
description: Gera um certificado fictício de conclusão de trilha DIO em Markdown
argument-hint: <nome do usuário> <tecnologia ou trilha>
---

Gere um certificado fictício de conclusão da DIO para o usuário "$1" referente à trilha "$2".

**Passo 1 — Buscar a trilha:**
Leia o arquivo `dio_explorer/data/trilhas_dio.json`. Localize a trilha cujo campo `tecnologia` ou `nome` contenha "$2" (case-insensitive, parcial). Se não encontrar, use os dados disponíveis para criar um certificado plausível com base no nome "$2".

**Passo 2 — Gerar o ID do certificado:**
Crie um ID único no formato `DIO-{ANO}-{8 chars aleatórios A-Z e 0-9}`. Exemplo: `DIO-2025-X4K9PL2Q`.

**Passo 3 — Calcular a carga horária:**
`numero_de_modulos × 8` horas. Se a trilha não for encontrada, estime com base na complexidade da tecnologia (mínimo 40h).

**Passo 4 — Gerar o certificado:**

Exiba o certificado **renderizado em Markdown** dentro de um bloco de código markdown (```markdown ... ```) para fácil cópia, seguido de uma mensagem de parabéns.

O certificado deve seguir exatamente este template:

---

```markdown
---

<div align="center">

# 🎓 CERTIFICADO DE CONCLUSÃO

### Digital Innovation One — DIO Platform

---

```
██████╗ ██╗ ██████╗
██╔══██╗██║██╔═══██╗
██║  ██║██║██║   ██║
██║  ██║██║██║   ██║
██████╔╝██║╚██████╔╝
╚═════╝ ╚═╝ ╚═════╝
```

---

## Certificamos que

# 🏅 {NOME DO USUÁRIO em exatamente como foi informado em $1}

concluiu com êxito a trilha de formação

## 📚 {nome da trilha}

> **Tecnologia:** {tecnologia}
> **Nível:** {nivel}
> **Carga Horária:** {numero_de_modulos × 8} horas
> **XP Conquistado:** {xp_total} XP

---

### ✅ Competências Desenvolvidas

{Liste 5 a 6 competências relevantes adquiridas na trilha, geradas pela IA com base na tecnologia}

✅ Competência 1  
✅ Competência 2  
✅ Competência 3  
✅ Competência 4  
✅ Competência 5  
✅ Competência 6  

---

### 🏆 Badges Conquistadas

{Liste todas as badges da trilha no formato: 🏆 Badge 1 | 🏆 Badge 2 | ...}

---

📅 **Data de Emissão:** {data atual no formato DD/MM/AAAA}  
🔐 **ID do Certificado:** `{ID gerado no Passo 2}`  
🌐 **Verificação:** `https://www.dio.me/certificate/{ID gerado no Passo 2}`

---

*Este certificado é emitido pela plataforma DIO em reconhecimento*  
*ao comprometimento e dedicação do(a) aluno(a) com sua jornada de aprendizado.*

</div>

---
```

---

Após o bloco de código, exiba esta mensagem final:

> 🎉 **Parabéns, $1!** Você concluiu a **{nome da trilha}**!  
> Compartilhe seu certificado no LinkedIn e mostre sua evolução ao mundo. 🚀  
> Use `/trilha $2` para explorar sua próxima formação ou `/desafio $2 avançado` para um novo desafio!
