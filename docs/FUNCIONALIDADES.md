# Lucid Merge — funcionalidades (estado atual)

Documento de referência das capacidades já implementadas na aplicação **Expo / React Native**, com dados locais (AsyncStorage) e nuvem (**Supabase**) quando o utilizador está autenticado.

---

## 1. Jogo principal (estilo 2048)

- **Grelha deslizante**: gestos de *swipe* (cima, baixo, esquerda, direita) para mover todas as peças na direção escolhida.
- **Fusão**: duas peças com o mesmo valor na mesma linha/coluna fundem-se numa só, com valor duplicado; a pontuação aumenta com o valor da fusão.
- **Novas peças**: após cada jogada válida é gerada uma nova peça num espaço vazio (**90%** valor `2`, **10%** valor `4`).
- **Vitória**: atingir uma peça com valor **≥ 2048** desbloqueia o estado de vitória; é possível **continuar a jogar** (“Keep going”) ou **reiniciar** (“New game”).
- **Fim de jogo**: quando não existem movimentos possíveis, o tabuleiro bloqueia e é mostrado o ecrã de fim de jogo com opção de **novo jogo**.
- **Reinício manual**: botão na barra inferior para começar nova partida **mantendo o melhor recorde** (`best`) daquele tamanho de grelha.
- **Undo**: desfaz a última jogada, com histórico limitado às **últimas 20** jogadas guardadas em memória.
- **Animações**: peças com movimento, escala em novas peças e em fusões, e remoção suave de peças “substituídas” na fusão (via Reanimated).

---

## 2. Personalização visual e de jogo

Definidas no **modal de definições** e aplicadas ao tabuleiro e à UI:

| Opção | Valores |
|--------|---------|
| **Tamanho da grelha** | 4×4, 5×5, 6×6 |
| **Paleta de cores das peças** | `pastel`, `sand`, `mist`, `bloom` |
| **Tema da interface** | `light` (claro) ou `dim` (escuro) |
| **Estilo das peças** | `matte` ou `glass` |
| **Números nas peças** | mostrar ou esconder |
| **Efeitos sonoros (SFX)** | ligados ou desligados |

- **Barra inferior do jogo**: atalho rápido para alternar tema claro/escuro (além das definições completas).
- **Tipografia**: carregamento de fontes **Inter** e **Fraunces** (incluindo itálico para o título “Lucid *Merge*”).
- **Ícones**: família **Lucide** (traço fino) na maior parte da UI; nos botões OAuth mantêm-se os ícones de marca **Google** e **Apple** (Ionicons).

---

## 3. Áudio

- Motor de som baseado em **WebView** + **Web Audio API** (osciladores, ruído breve para *swipe*, tons para fusões, etc.).
- Eventos mapeados: `merge`, `swipe`, `spawn`, `undo`, `victory`, `gameover`.
- Respeita o toggle **SFX on/off** das definições.

---

## 4. Ajuda

- **Modal “How to drift.”** com texto explicativo: regras de movimento e fusão, probabilidade de 2/4, vitória aos 2048, undo até 20 vezes, e menção aos tamanhos de grelha nas definições.

---

## 5. Autenticação e conta (Supabase Auth)

Ecrã modal **`/auth`**:

- **Email e palavra-passe**: modo **Sign in** e **Create account** (registo); mensagem informativa se o registo exigir confirmação por email (sem sessão imediata).
- **Google**: OAuth com `signInWithOAuth`, abertura em **sessão de browser** e `setSession` com tokens devolvidos no redirect (`scheme` da app: `lucidemerge`).
- **Apple (iOS)**: `Sign in with Apple` nativo + `signInWithIdToken` no Supabase (nonce hasheado).
- **Timeouts** em pedidos sensíveis (ex.: email e Google) para evitar espera indefinida em caso de rede fraca.
- **Fechar** o modal sem concluir login.

Sessão persistida com **AsyncStorage** (cliente Supabase configurado para `persistSession` e refresh automático).

---

## 6. Perfil do utilizador (`/profile`)

- Acesso **após login** (dados do perfil em `profiles`).
- **Avatar** com iniciais derivadas do nome ou email.
- **Nome de exibição**: edição inline, gravação na tabela `profiles` e atualização local do perfil.
- **Melhores pontuações por tamanho**: cartão com melhor score para grelhas **4×4**, **5×5** e **6×6** (campo `best_scores` em JSON).
- Atalho para o **leaderboard**.
- **Terminar sessão** (sign out Supabase) e fecho do modal.

---

## 7. Leaderboard (`/leaderboard`)

- Lista até **50** jogadores com pontuação **> 0** para o tamanho de grelha selecionado (4, 5 ou 6).
- Ordenação por melhor score nesse tamanho (dados em `best_scores` no perfil).
- **Medalhas** 🥇🥈🥉 para os três primeiros; posição numérica para os restantes.
- Destaque da linha do **utilizador atual** (“(you)”) quando aplicável.
- Estado vazio com mensagem amigável se não houver pontuações para aquele tamanho.
- **Voltar** (navegação para trás).

---

## 8. Sincronização de dados

### Local (AsyncStorage)

- **Definições da app** (`lucid.settings`): grelha, paleta, tema, estilo de peça, números, SFX.
- **Melhor score por tamanho** (`lucid.best.{4|5|6}`): persistência do recorde local por dimensão.

### Nuvem (Supabase), com utilizador autenticado

- **Perfil** (`profiles`): `display_name`, `email`, `best_score`, `best_scores` (JSON por tamanho), `settings` (JSON), `updated_at`.
- **Ao iniciar sessão**: leitura de `settings` no perfil e **fusão com as definições locais** (a nuvem prevalece quando existe conteúdo).
- **Ao alterar definições**: escrita local imediata; **atualização debounced (~800 ms)** do JSON `settings` no perfil.
- **Melhor pontuação**: ao bater recorde, atualização de `best_scores` para o tamanho atual; ao mudar tamanho ou após login, **importação** do melhor valor da nuvem para o estado do jogo (`setBest`).

### Modelo de dados (migrações)

- Tabela `profiles` ligada a `auth.users`, RLS (ler/atualizar o próprio perfil; leitura pública para leaderboard).
- Trigger para criar linha em `profiles` quando surge um novo utilizador em `auth.users`.
- Coluna **`best_scores`** (JSONB) para pontuações por tamanho de grelha.

---

## 9. Navegação e estrutura de ecrãs

- **Stack** principal (`app/_layout.tsx`): tab principal, modais `auth`, `profile`, `leaderboard` (sem cabeçalho nativo).
- **Tab principal**: ecrã único do jogo em `app/(tabs)/index.tsx`.
- **Rotas auxiliares**: `router.push` para auth, perfil e leaderboard; `router.dismiss` ao concluir auth.

---

## 10. Ficheiros de template / legado

- Existe um ecrã **`app/modal.tsx`** (“This is a modal”) típico do template Expo; **não está registado** na `Stack` atual do `_layout` — funcionalidade do produto não depende dele.

---

## 11. Requisitos de configuração

- Variáveis de ambiente **`EXPO_PUBLIC_SUPABASE_URL`** e **`EXPO_PUBLIC_SUPABASE_KEY`** para o cliente Supabase.
- No projeto Supabase: Auth (email, Google, Apple conforme configurados no dashboard), tabela `profiles` e políticas alinhadas às migrações do repositório.

---

*Última revisão alinhada ao código do repositório (estrutura de pastas `app/`, `components/game/`, `contexts/`, `hooks/`, `constants/theme.ts`, migrações em `supabase/migrations/`).*
