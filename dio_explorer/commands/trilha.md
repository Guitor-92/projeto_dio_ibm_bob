# /trilha

## Descrição
Busca e exibe um plano de estudos formatado para uma trilha da DIO, a partir do nome da tecnologia informada.

## Uso
```
/trilha <tecnologia>
```

**Exemplos:**
- `/trilha Python`
- `/trilha React`
- `/trilha Docker`
- `/trilha AWS`

---

## Comportamento

1. Leia o arquivo `data/trilhas_dio.json`.
2. Busque a(s) trilha(s) cujo campo `tecnologia` ou `nome` contenha o termo informado (busca case-insensitive, parcial).
3. Se **nenhuma trilha for encontrada**, responda:
   > ❌ Nenhuma trilha encontrada para `<tecnologia>`. Verifique o nome ou tente uma busca mais genérica.
   > 
   > 💡 Tecnologias disponíveis: Python, Java, React, Angular, Node.js, AWS, Machine Learning, Git, Docker, SQL, TypeScript, Vue.js, Azure, Flutter, Kotlin, Data Engineering, CyberSecurity, .NET, DevOps, IA Generativa, Go, Rust, UX/UI, Blockchain, PHP, Power BI, Ruby, Swift, GCP, Computação Quântica.
4. Se **uma ou mais trilhas forem encontradas**, exiba o plano completo conforme o template abaixo.

---

## Template de Resposta

Para cada trilha encontrada, gere a seguinte saída em Markdown:

```
# 🎓 Plano de Estudos — <nome da trilha>

**Tecnologia:** <tecnologia>
**Nível:** <nivel>
**Total de Módulos:** <numero_de_modulos>
**XP Total ao Concluir:** <xp_total> XP

---

## 📚 Módulos da Trilha

Gere os títulos dos módulos com base no nome e tecnologia da trilha.
Crie <numero_de_modulos> módulos realistas e progressivos, numerados de 1 a N.
Cada módulo deve ter um nome descritivo condizente com a tecnologia, passando do básico ao avançado.

Formato de cada módulo:
> **Módulo <N> — <Título do Módulo>**
> 📌 Conteúdo principal: <breve descrição do que é abordado neste módulo>
> ⏱️ Carga estimada: <estimativa de horas entre 4h e 12h>
> 🏅 Badge desbloqueável: <badge correspondente, se disponível, senão "—">

---

## 🏅 Badges Disponíveis

Liste todas as badges da trilha em formato de lista com ícone de medalha:
> 🥇 <badge 1>
> 🥈 <badge 2>
> ...

---

## 🎥 Lives ao Vivo

Para cada live na trilha:
> 📅 **<titulo>**
> 👤 Instrutor: <instrutor> | 🗓️ Data: <data>

---

## 💰 Informações de Acesso

- **Acesso vitalício:** <Sim / Não>
- **Promoção ativa:** <Sim: X% de desconto até <validade> / Não>

---

## 🚀 Próximos Passos

Finalize com uma mensagem motivacional curta incentivando o aluno a iniciar a trilha.
Use o comando `/desafio <tecnologia> <nível>` para testar seus conhecimentos ao longo da jornada.
```

---

## Notas de Implementação

- Se o usuário digitar uma tecnologia com múltiplas trilhas correspondentes, exiba todas.
- Os títulos dos módulos devem ser **gerados pela IA** de forma coerente com a tecnologia — não estão no JSON.
- Distribua as badges disponíveis nos módulos finais da trilha (último 30% dos módulos).
