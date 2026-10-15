# entre — finanças pessoais

App de finanças pessoais com interface mobile-first, tema escuro, lançamentos por mês, categorias, status de pagamento/recebimento e regras recorrentes com ocorrências editáveis individualmente.

## Stack

- Next.js 16 + React 19 + TypeScript
- Supabase Auth + Postgres + Row Level Security
- Recharts + Lucide
- Deploy recomendado: Vercel conectado ao GitHub

## Rodar localmente

1. Instale Node.js 20.9 ou superior (requisito do Next.js 16).
2. Copie `.env.local.example` para `.env.local`.
3. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os dados de **Supabase > Project Settings > API**.
4. No Supabase, abra **SQL Editor**, cole e execute `supabase/schema.sql`.
5. No terminal, rode:
   ```bash
   npm install
   npm run dev
   ```
6. Acesse `http://localhost:3000` e crie sua conta com e-mail e senha.

> Use a chave pública `anon`/publishable no navegador. Nunca coloque a `service_role` no app ou na Vercel. O schema ativa RLS para que cada conta só leia e altere seus próprios dados.

## Publicar no GitHub + Vercel

1. Crie um repositório vazio no GitHub.
2. Na pasta do projeto, rode os comandos abaixo (substitua a URL pela do seu repositório):
   ```bash
   git init
   git add .
   git commit -m "feat: app de finanças pessoais entre"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```
3. Na Vercel, importe esse repositório como projeto Next.js.
4. Em **Settings > Environment Variables**, adicione as duas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` para Production (e Preview, se desejar).
5. Faça o deploy.
6. No Supabase, configure **Authentication > URL Configuration**: defina a URL da Vercel como Site URL e adicione também os domínios Preview se for usá-los.

## Recorrências: como funciona

Ao cadastrar um lançamento recorrente, o app cria uma regra e uma ocorrência no mês selecionado. Ao abrir outros meses, a função SQL `ensure_month_occurrences` cria as ocorrências ausentes. As ocorrências são cópias dos dados da regra: alterar valor, descrição, data ou categoria de uma ocorrência altera somente aquele mês. Pausar uma regra impede novas ocorrências, sem apagar o histórico. Ao reativar, a geração volta a partir do próximo mês calendário.

## Notas

- O botão **Carregar meus exemplos** importa os dados da planilha fornecida para o mês selecionado. Ele aparece somente quando o mês não tem lançamentos.
- A autenticação está no cliente com sessão persistida pelo Supabase Auth.
- Para a primeira versão, a aplicação assume um único usuário por sessão; as políticas RLS já isolam os dados de cada usuário.
