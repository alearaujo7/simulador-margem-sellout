# Simulador de Margem e Sell-out — versão SaaS

## O que já está pronto

- Banco de dados no Supabase (projeto `simulador-margem-sellout`), já testado:
  - Cada vendedor cria login próprio.
  - Cada um só vê suas próprias simulações (testado e confirmado).
  - Plano grátis: até 5 simulações salvas, sem link de compartilhamento.
  - Plano Pro: ilimitado + link de compartilhamento (o campo já existe no banco — só falta ligar a cobrança, ex. Stripe, quando você quiser).
- Site em Next.js com: página de vendas, cadastro, login, simulador completo e página pública de simulação compartilhada.

## Publicar no GitHub e na Vercel

### 1. GitHub
1. Baixe e **descompacte** este arquivo no seu computador.
2. No GitHub, crie um repositório novo (ex.: `simulador-margem-sellout`).
3. Na página do repositório: **Add file → Upload files**.
4. Arraste **todos os arquivos e pastas descompactados** (inclusive as pastas `app` e `lib`) e clique em **Commit changes**.

### 2. Vercel
1. Em vercel.com: **Add New... → Project → Import Git Repository** e escolha o repositório que você acabou de criar.
2. Antes de clicar em Deploy, abra **Environment Variables** e adicione estas duas:

   | Nome | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://gpwustyiolwsxxzqqhes.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_IrmI2IrXIXeLo_IEKoB7zg_q-zZ-VtH` |

3. Clique em **Deploy**. Em 1–2 minutos seu SaaS está no ar, com cadastro, login e banco de dados funcionando de verdade.

Essas duas chaves são "públicas" por design (o Supabase foi feito pra isso) — a segurança de verdade está nas regras que já configurei dentro do banco, não nelas.

## Confirmação de e-mail

Por padrão, o Supabase exige que a pessoa confirme o e-mail antes de conseguir entrar. Se quiser desligar isso (pra testar mais rápido), vá em **supabase.com → seu projeto → Authentication → Providers → Email** e desmarque "Confirm email". Para produção, o recomendado é deixar ligado.

## Próximos passos possíveis (quando quiser)
- Conectar o Stripe pra cobrar o plano Pro de verdade (hoje o botão "Fazer upgrade" só abre um e-mail).
- Página de "minha conta" mostrando o plano atual.
- Personalizar o texto da página de vendas com seu case, preço e contato.

Qualquer coisa dessas, é só me pedir que eu ajusto o código e te devolvo os arquivos atualizados.
