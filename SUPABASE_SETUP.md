# Supabase Setup

## O que este projeto espera

- Um projeto Supabase ativo.
- Auth com e-mail e senha habilitado.
- O SQL de [supabase/schema.sql](supabase/schema.sql) aplicado no SQL Editor.
- Um arquivo `.env` local com as variaveis abaixo:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## Comportamento da aplicacao

- Sem essas variaveis, o app continua operando em modo local de demonstracao.
- Com essas variaveis, o login/cadastro usa Supabase Auth.
- Com essas variaveis, o editor salva os graficos na tabela `public.charts`.

## Checklist de configuracao

1. Criar projeto no Supabase.
2. Em `Authentication > Sign In / Providers`, habilitar Email.
3. Em `SQL Editor`, rodar o conteudo de [supabase/schema.sql](supabase/schema.sql).
4. Em `Authentication > URL Configuration`, adicionar a URL local de desenvolvimento.
Exemplo: `http://127.0.0.1:5173`
5. Criar `.env` a partir de [.env.example](.env.example).
6. Reiniciar `npm run dev`.

## Escopo atual da integracao

- Login
- Cadastro
- Logout
- Recuperacao de senha por e-mail
- Persistencia dos graficos por usuario

## O que ainda nao existe

- Compartilhamento de graficos entre usuarios.
- Upload de imagens do projeto para dentro do editor.
- Biblioteca de simbolos de crochet mais avancada, no estilo Stitch Fiddle.
