# /certificados

## Descrição
Gera um certificado fictício em Markdown com o nome do usuário e a trilha por ele concluída.

## Uso
```
/certificados <nome do usuário> <trilha ou tecnologia>
```

**Exemplos:**
- `/certificados João Silva Python`
- `/certificados Maria Oliveira React`
- `/certificados Pedro Santos AWS`
- `/certificados Ana Costa Machine Learning`

---

## Comportamento

1. Receba o **nome completo do usuário** e a **trilha/tecnologia** concluída.
2. Se apenas um argumento for passado, interprete como o nome do usuário e solicite a trilha:
   > ❓ Qual trilha você concluiu? Ex: `/certificados <nome> Python`
3. Leia o arquivo `data/trilhas_dio.json` e localize a trilha correspondente à tecnologia informada (busca case-insensitive, parcial).
4. Se a trilha não for encontrada, use as informações disponíveis para gerar um certificado genérico com base no nome da tecnologia informada.
5. Gere um **ID de certificado único** no formato: `DIO-<ANO>-<HASH>` onde `<HASH>` são 8 caracteres alfanuméricos aleatórios em maiúsculas.
6. Use a **data atual** (ou a data mais próxima disponível no contexto) como data de emissão.
7. Formate o certificado conforme o template abaixo, em Markdown puro.

---

## Template de Resposta

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

# 🏅 <NOME DO USUÁRIO>

concluiu com êxito a trilha de formação

## 📚 <NOME DA TRILHA>

> **Tecnologia:** <tecnologia>
> **Nível:** <nivel>
> **Carga Horária:** <numero_de_modulos × 8> horas
> **XP Conquistado:** <xp_total> XP

---

### Competências Desenvolvidas

<Liste de 4 a 6 competências relevantes adquiridas na trilha, com base na tecnologia>

✅ <Competência 1>
✅ <Competência 2>
✅ <Competência 3>
✅ <Competência 4>
✅ <Competência 5, se aplicável>
✅ <Competência 6, se aplicável>

---

### Badges Conquistadas

<Liste todas as badges da trilha>
🏆 <badge 1> | 🏆 <badge 2> | 🏆 <badge 3> | ...

---

📅 **Data de Emissão:** <data atual no formato DD/MM/AAAA>
🔐 **ID do Certificado:** `DIO-<ANO>-<HASH aleatório de 8 chars maiúsculos>`
🌐 **Verificação:** `https://www.dio.me/certificate/<ID DO CERTIFICADO>`

---

*Este certificado é emitido pela plataforma DIO em reconhecimento*
*ao comprometimento e dedicação do(a) aluno(a) com sua jornada de aprendizado.*

</div>

---
```

---

## Notas de Implementação

- O **nome do usuário** deve aparecer em destaque (`# 🏅`) e exatamente como fornecido, incluindo acentos e capitalização.
- A **carga horária** é calculada como `numero_de_modulos × 8` horas.
- O **ID do certificado** deve ser único a cada geração — use `DIO-<ANO>-` seguido de 8 caracteres aleatórios (letras A-Z e dígitos 0-9).
- O campo de verificação usa a URL `https://www.dio.me/certificate/<ID>` com o ID gerado.
- As **competências** devem ser geradas pela IA de forma coerente com a tecnologia da trilha.
- Se a trilha não estiver no JSON, gere competências e badges fictícias, mas plausíveis, com base na tecnologia.
- O certificado deve ser exibido como **bloco de código Markdown** para fácil cópia, além de renderizado na conversa.
- Após exibir o certificado, inclua esta mensagem:

> 🎉 **Parabéns, <nome>!** Você concluiu a **<nome da trilha>**!
> Compartilhe seu certificado no LinkedIn e mostre ao mundo sua evolução. 🚀
> Use `/trilha <tecnologia>` para explorar sua próxima formação!
