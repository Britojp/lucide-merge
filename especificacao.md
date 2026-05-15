# Lucid Merge — Especificação do jogo e design system

Documento de referência para portar **Lucid Merge** para mobile (ou outra plataforma), alinhado ao comportamento e à identidade visual da implementação web atual (`Lucid Merge.html`, `lucid-merge.jsx`, `tweaks-panel.jsx`).

---

## 1. Visão do produto

**Lucid Merge** é uma variante suave e contemplativa do puzzle estilo **2048**: peças deslizam, fundem-se quando têm o mesmo valor e o tabuleiro ganha uma nova peça após cada jogada válida. A proposta é **movimento contínuo** (animação por translação entre células, sem remontar o DOM de forma brusca), paleta pastel ou temas alternativos, tipografia editorial no título e microcopy poético em estados de vitória e game over.

**Público-alvo implícito:** jogadores casuais que valorizam estética calma, undo e temas claros/escuros suaves.

**Idioma da interface:** inglês na build atual (títulos de overlay, botões, hints). O documento está em português para a equipa; a app mobile pode localizar mantendo os tokens visuais abaixo.

---

## 2. Regras de jogo (mecânica)

### 2.1 Tabuleiro

- Grelha **N×N**, com **N configurável**: `4`, `5` ou `6` (padrão `4`).
- Cada célula pode estar vazia ou ocupada por **uma** peça com valor numérico (potências de 2 a partir de `2` e `4` no spawn).

### 2.2 Movimento

- Direções: **esquerda**, **direita**, **cima**, **baixo**.
- Em cada jogada, **todas** as peças deslizam na direção escolhida até encostar a outra peça ou à borda.
- Ordem de processamento por **linha** (horizontal para esquerda/direita, vertical para cima/baixo), na ordem do movimento (ex.: para “esquerda”, colunas da esquerda para a direita dentro de cada linha).

### 2.3 Fusão (merge)

- Duas peças **adjacentes na linha de deslize** com o **mesmo valor** fundem-se em **uma** peça com valor **dobrado**.
- **Uma peça resultante de um merge na mesma linha não funde de novo** na mesma jogada com uma terceira peça igual (comportamento clássico 2048: no máximo um merge por “slot” por movimento).
- A peça que “morre” no merge mantém posição animada alinhada à sobrevivente até o fim da fase de animação (detalhe de implementação para UX contínua).

### 2.4 Pontuação

- A cada merge, soma-se à pontuação o **valor da peça resultante** (ex.: fundir dois `8` → `+16`).
- **Score** é acumulado ao longo da partida; **Best** é o máximo histórico persistido (ver secção 6).

### 2.5 Spawn após jogada válida

- Só há spawn se o movimento **alterou** o tabuleiro (houve deslocamento ou merge).
- Após a animação, nas células vazias, spawna **1** nova peça por jogada.
- Valor do spawn: **90%** probabilidade de `2`, **10%** de `4`.
- Posição: célula vazia **aleatória uniforme** entre todas as vazias.

### 2.6 Vitória (win)

- Condição: existe alguma peça com valor **≥ 2048** e o jogador **ainda não** escolheu “continuar após vitória”.
- Comportamento: overlay de vitória (ver UI). O jogador pode **continuar** (`keepGoing`): aí o overlay de vitória deixa de aparecer até nova condição de vitória se desejar reimplementar, ou simplesmente não bloquear — na web, `keepGoing` suprime o overlay de win.
- Atalho web: **Enter** dispensa o overlay de vitória e ativa continuação.

### 2.7 Game over

- Condição: **não existe movimento válido** — tabuleiro cheio **e** nenhum par adjacente (horizontal ou vertical) com o mesmo valor.
- Overlay distinto de vitória (copy diferente).

### 2.8 Undo

- Desfaz **a última jogada** (estado das peças e score anteriores ao movimento).
- Histórico limitado a **20** entradas (as mais antigas são descartadas).
- Não deve ser possível undo durante lock de animação se a implementação for fiel à web (animação tranca input).

### 2.9 Novo jogo (reset)

- Reposiciona tabuleiro com **duas** peças iniciais (mesma lógica `placeRandom` com `count = 2`).
- Zera score, estados de vitória/`keepGoing` e histórico de undo.

---

## 3. Modelo de dados (peça / tile)

Cada peça é um objeto com pelo menos:

| Campo | Tipo | Descrição |
|--------|------|------------|
| `id` | inteiro único | Estável entre frames; usado como chave de lista para animação. |
| `value` | inteiro | Potência de 2 (2, 4, 8, …). |
| `r`, `c` | inteiros | Linha e coluna (0-based) no tabuleiro N×N. |
| `mergedFrom` | boolean (opcional) | Dispara animação de “pop” no frame de assentamento pós-merge. |
| `isNew` | boolean (opcional) | Dispara animação de entrada no spawn. |
| `dying` | boolean (transiente) | Peça que será removida após animação de merge. |

Estados de UI adicionais: `won`, `keepGoing`, `animating` / lock de input, `score`, `best`.

---

## 4. Controles e input

### 4.1 Teclado (referência desktop)

| Ação | Teclas |
|------|--------|
| Esquerda | `ArrowLeft`, `A`, `a`, `H`, `h` |
| Direita | `ArrowRight`, `D`, `d`, `L`, `l` |
| Cima | `ArrowUp`, `W`, `w`, `K`, `k` |
| Baixo | `ArrowDown`, `S`, `s`, `J`, `j` |
| Reiniciar | `R`, `r` |
| Undo | `U`, `u` |
| Continuar após vitória | `Enter` (com overlay de vitória ativo) |

### 4.2 Toque / swipe (já usado na web)

- **Início:** guardar coordenadas do primeiro toque.
- **Fim:** comparar delta com ponto inicial; ignorar se `max(|dx|, |dy|) < 24` px.
- Se o gesto for majoritariamente horizontal: `dx > 0` → direita, senão esquerda.
- Se vertical: `dy > 0` → baixo, senão cima.

**Mobile:** replicar limiar de 24 px ou ajustar com testes de UX; considerar **dead zone** maior em ecrãs pequenos se houver conflito com scroll (na web `body` tem `overflow: hidden`).

### 4.3 Botões na UI

- **New:** reset.
- **Restart / Undo / tema / ajuda:** barra de ícones no rodapé (ver componentes).

---

## 5. Animações e temporização

Valores da implementação atual (referência para replicar o “feel”):

| Fase | Duração aproximada | Notas |
|------|---------------------|--------|
| Translação das peças (`transform`) | **170 ms** | `cubic-bezier(0.22, 0.61, 0.36, 1)` |
| Timeout antes de “assentar” estado + spawn | **180 ms** | Após isso, novo tile e score atualizado |
| Limpeza de flags `mergedFrom` / `isNew` | **+180 ms** após assentar | Desbloqueio do próximo movimento |
| Keyframes `lm-in` (novo tile) | `animMs + 60` ms (~230 ms) | Escala 0 → 1.08 → 1 |
| Keyframes `lm-pop` (merge) | idem | Escala até ~1.14 com sombra reforçada |
| Keyframes `lm-fade` (tile que desaparece) | opacidade → 0 | |
| Overlay (`lm-overlay`) | 0.25–0.6 s conforme contexto | Fade in |

**Z-index relativo:** tile em merge > tile normal > tile a morrer.

**Tipografia dinâmica no número da peça:** função `sizeForValue(v, base)` — `base = max(18, cell * 0.42)`; fatores: `<100` → 1×; `<1000` → 0.82×; `<10000` → 0.66×; caso contrário 0.55×.

---

## 6. Persistência

| Chave | Valor |
|-------|--------|
| `lucid.best` | número inteiro (melhor pontuação) |

Atualiza quando `score > best` após jogadas.

---

## 7. Configurações (Tweaks)

Painel flutuante “Tweaks” (ferramenta de edição/protótipo; em mobile pode virar **definições** no ecrã).

| Chave | Valores | Padrão |
|-------|---------|--------|
| `size` | `4`, `5`, `6` | `4` |
| `palette` | `pastel`, `sand`, `mist`, `bloom` | `pastel` |
| `theme` | `light`, `dim` | `light` |
| `tileStyle` | `matte`, `glass` | `matte` |
| `showNumbers` | boolean | `true` |

Alterar `size` reinicia a partida (comportamento atual).

---

## 8. Design system

### 8.1 Princípios

- Estética **macia**, **papel/estúdio**, sem contraste agressivo.
- Superfícies com **sombra difusa** e **highlight** interior (inset) leve.
- **Grain** global muito subtil sobre o fundo (textura de pontos + `mix-blend-mode`).
- Tema **dim** (“noite”) mantém a mesma lógica de elevação, com fundos quentes escuros — não é preto puro.

### 8.2 Tipografia

| Uso | Família | Pesos / notas |
|-----|---------|----------------|
| Corpo, UI, números nas peças | **Inter** | 300, 400, 500, 600, 700 |
| Título “Lucid Merge”, títulos de overlay e ajuda | **Fraunces** (serif) | opsz 9..144; pesos 300, 400, 500 — itálico em “Merge” |

**Carregamento web:** Google Fonts  
`https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&display=swap`

**Mobile:** incorporar fontes equivalentes (licenças Google Fonts) ou subset; manter hierarquia: Fraunces para marca e momentos “hero”; Inter para tudo o resto.

**Escala de título (header):** `clamp(34px, 5vw, 46px)`, peso 300, letter-spacing `-0.02em`, cor `var(--ink)`.

**Media query existente:** `max-width: 480px` → `body { font-size: 14px }`.

### 8.3 Tokens semânticos — tema claro (`:root`)

| Token | Valor | Uso |
|-------|--------|-----|
| `--bg` | `#F5F3EF` | Superfície base |
| `--bg-2` | `#ECE7E1` | Cartões, botões secundários |
| `--board` | `#E4DDD6` | Área do tabuleiro |
| `--cell` | `#DCD4CB` | Células vazias (grelha) |
| `--ink` | `#2E2A24` | Texto principal |
| `--ink-2` | `#6B645B` | Texto secundário |
| `--ink-3` | `#A39B91` | Rótulos discretos, hints |
| `--accent` | `#8C8378` | Acento neutro (reservado) |
| `--line` | `rgba(46,42,36,.08)` | Bordas sutis |
| `--tile-shadow` | `0 8px 24px rgba(46,42,36,.06), 0 1px 0 rgba(255,255,255,.7) inset` | Elevação das peças |
| `--board-shadow` | `0 18px 60px rgba(46,42,36,.06), 0 1px 0 rgba(255,255,255,.55) inset` | Elevação do tabuleiro |
| `--radius-tile` | `22px` | Peças e células placeholder |
| `--radius-board` | `28px` | Container do tabuleiro |
| `--radius-btn` | `18px` | Token definido; botões na UI usam também `14px`/`16px` onde aplicável |

**Fundo `body` (claro):** gradiente radial  
`120% 90% at 50% 0%` — `#FBF8F3` → `#F5F3EF` 45% → `#EAE4DD` 100%.

**Grain (`body::before`):**  
`radial-gradient(rgba(46,42,36,.045) 1px, transparent 1px)`, `background-size: 3px 3px`, `mix-blend-mode: multiply`, `opacity: 0.5`, `pointer-events: none`, cobertura fixa full viewport.

### 8.4 Tokens — tema dim (`body.theme-dim`)

| Token | Valor (dim) |
|-------|-------------|
| Fundo | `radial-gradient(120% 90% at 50% 0%, #2A2823 0%, #232017 55%, #1B1812 100%)` |
| `--ink` | `#EFE9DF` (e cor de texto base no body) |
| `--ink-2` | `#B7AE9E` |
| `--ink-3` | `#7B7264` |
| `--bg` | `#1F1C16` |
| `--bg-2` | `#26221B` |
| `--board` | `#2A251D` |
| `--cell` | `#322C23` |
| `--line` | `rgba(255,255,255,.05)` |
| `--tile-shadow` | `0 10px 28px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.04) inset` |
| `--board-shadow` | `0 24px 80px rgba(0,0,0,.4), 0 1px 0 rgba(255,255,255,.03) inset` |

Grain em dim: mesma textura, `opacity: 0.18` no `::before`.

### 8.5 Paletas de valores das peças

Cores por **valor exato** até `4096`; acima, a implementação usa a cor de `4096` como teto (`Math.min(4096, value)`).

#### Pastel (`pastel`)

- Foreground dos números: `#3A352D`
- Mapa:  
  `2:#A8DADC` · `4:#B8C0FF` · `8:#CDB4DB` · `16:#FFC8DD` · `32:#FFD6A5` · `64:#FDFFB6` · `128:#CAFFBF` · `256:#9BF6FF` · `512:#BDB2FF` · `1024:#FFC6FF` · `2048:#FFADAD` · `4096:#FFB5A7`

#### Sand (`sand`)

- FG: `#3A352D`
- Tons areia/madeira claros a escuros (2 → 4096):  
  `#EFE7DA`, `#E4D8C4`, `#D7C5A6`, `#C9B187`, `#BFA071`, `#B08D5B`, `#9D7A48`, `#896839`, `#74562C`, `#5E4422`, `#48331A`, `#33240F`

#### Mist (`mist`)

- FG: `#2C3340`
- Escala azul-acinzentada:  
  `#E6ECF1`, `#D2DCE6`, `#BCCBD9`, `#A6B8CB`, `#90A6BE`, `#7993B0`, `#6280A2`, `#536F8E`, `#465E78`, `#3B4F65`, `#314253`, `#293743`

#### Bloom (`bloom`)

- FG: `#3A2C36`
- Rosa profundo em gradiente:  
  `#FCEEF5`, `#F8D7E6`, `#F2BBD2`, `#EB9CBC`, `#E07FA8`, `#D26597`, `#BC5188`, `#A14279`, `#86376A`, `#6C2E5A`, `#54264A`, `#3F1E3B`

**Fallback** se valor não mapeado: `#E4DDD6` (alinhado ao tom de tabuleiro claro).

### 8.6 Estilo de peça (`tileStyle`)

| Modo | Borda | Efeito extra |
|------|--------|----------------|
| `matte` | `1px solid rgba(255,255,255,.4)` | — |
| `glass` | `1px solid rgba(255,255,255,.55)` | `backdrop-filter: blur(6px)` |

Sombra: sempre `var(--tile-shadow)`.

### 8.7 Layout e medidas do tabuleiro

- Largura do tabuleiro: `min(560px, 92vw)`, **aspect-ratio 1:1**.
- Padding interno do tabuleiro: `pad = max(10, round(boardWidth * 0.028))`.
- Gap entre células: `gap = max(8, round(boardWidth * 0.022))`.
- Tamanho da célula: `cell = floor((boardWidth - 2*pad - gap*(n-1)) / n)`.
- Células vazias: fundo `var(--cell)`, cantos `var(--radius-tile)`, **opacidade 0.65**.

### 8.8 Layout da página

- Contentor principal: `min-height: 100vh`, flex column, alinhado ao centro, `padding: clamp(24px, 5vh, 56px) 24px 24px`, `gap: clamp(20px, 4vh, 36px)`.
- Header e footer: largura `min(560px, 92vw)`.

### 8.9 Componentes UI (especificação visual)

#### Score

- Flex column, centrado, `padding: 10px 18px`, `min-width: 86px`.
- Fundo `var(--bg-2)`, `border-radius: 16px`, `border: 1px solid var(--line)`.
- Label: `10px`, weight `600`, letter-spacing `0.14em`, uppercase, cor `var(--ink-3)`.
- Valor: Score `22px` / Best `20px`, weight `500`, `tabular-nums`, `margin-top: 2px`.

#### Botão “New”

- `border: 1px solid var(--line)`, fundo `var(--bg-2)`, texto `var(--ink-2)`.
- `padding: 0 16px`, `border-radius: 16px`, `font-size: 12px`, weight `500`, letter-spacing `0.06em`, uppercase.
- Hover: cor texto → `var(--ink)`.

#### FooterBtn (ícones)

- `46×46px`, `border-radius: 14px`, ícone ~`22px`.
- Estado normal: fundo transparente, cor `var(--ink-2)`.
- Hover: fundo `var(--bg-2)`, cor `var(--ink)`; ativo (tema): fundo `var(--bg-2)`.
- `transition: background .25s, color .25s, transform .2s`; press: `scale(0.94)`.

#### Barra de ícones (footer)

- `display: flex`, `gap: 6px`, `padding: 6px 8px`, fundo `var(--bg-2)`, borda `1px solid var(--line)`, `border-radius: 18px`.

#### Texto de hint (footer)

- `font-size: 12px`, cor `var(--ink-3)`, letter-spacing `0.02em`, centrado.

#### `<kbd>` (hints)

- `display: inline-block`, `min-width: 22px`, `padding: 2px 7px`, `font-size: 11px`, weight `500`.
- Fundo `var(--bg-2)`, borda `1px solid var(--line)`, `border-radius: 6px`, cor `var(--ink-2)`, `font-variant-numeric: tabular-nums`.

#### Overlay vitória / game over

- Cobre o tabuleiro: `inset: 0`, grid centrado.
- Fundo claro: `rgba(245,243,239,0.62)` + `backdrop-filter: blur(8px)` (e prefixo WebKit).
- Título Fraunces `44px`, weight `400`, letter-spacing `-0.01em`.
- Subtítulo `13px`, cor `var(--ink-2)`, letter-spacing `0.02em`.
- Copy:
  - **Vitória:** título `Lucid.` · subtítulo `You reached the bloom.`
  - **Game over:** título `Hush.` · subtítulo `No moves left. Breathe, restart.`

#### Help overlay (modal)

- Scrim: `rgba(20,16,8,.32)` + blur `8px`, full screen, `z-index: 50`.
- Cartão: `max-width: 380px`, fundo `var(--bg)`, borda `1px solid var(--line)`, `border-radius: 22px`, padding `26px 26px 22px`, sombra `0 30px 100px rgba(0,0,0,.18)`.
- Título: Fraunces `26px`, weight `400`, texto `How to drift.`
- Corpo: `13.5px`, cor `var(--ink-2)`, line-height `1.55`.
- Lista sem marcadores, `gap: 10px`, itens `13px`.
- Rodapé nota: `12px`, cor `var(--ink-3)`; destaque numérico `2048` com `bold` em `var(--ink-2)`.
- Botão fechar: largura total, estilo alinhado ao “New” (`border-radius: 14px`, uppercase, etc.).

### 8.10 Ícones (SVG inline)

Estilo comum: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `strokeWidth: 1.6`, `strokeLinecap` / `strokeLinejoin`: `round`.

Nomes usados: `restart`, `undo`, `eye` (definido mas não usado na barra atual), `help`, `close`, `sun`, `moon`.

### 8.11 Painel Tweaks (referência de UI secundária)

Não faz parte do “produto jogador” final, mas define um **painel glass** opcional para ferramentas:

- Canto inferior direito, largura `280px`, `max-height: calc(100vh - 32px)`.
- Fundo `rgba(250,249,247,.78)`, blur `24px` + saturate `160%`, borda `0.5px solid rgba(255,255,255,.6)`, raio `14px`.
- Tipografia do painel: ~`11.5px` system sans.

Em mobile, preferir **ecrã de definições** nativo reutilizando os mesmos controlos semânticos (grelha, tema, paleta, estilo de peça, números).

---

## 9. Acessibilidade e mobile

- Botões com **`aria-label`** e **`title`** onde aplicável (ícones).
- Garantir **área tocável** ≥ 44 pt para ícones e ações principais (web usa 46 px — bom ponto de partida).
- Evitar gestos de swipe em conflito com **navegação OS**; considerar jogar só na área do tabuleiro em vez de `window`.
- Suportar **VoiceOver / TalkBack**: anunciar score, game over, vitória; rotular peças se mostrar números.
- **Orientação:** tabuleiro quadrado adapta-se bem; fixar `safe-area-inset` para iPhone com notch.

---

## 10. Stack técnica (referência web)

- React 18 (UMD), Babel standalone, sem bundler.
- Sem backend; estado local + `localStorage`.

**Mobile sugerido:** React Native, Flutter ou motor nativo — reimplementar motor `move` / `canMove` / `placeRandom` com testes unitários para paridade com esta especificação.

---

## 11. Checklist de paridade para a versão mobile

- [ ] Grelhas 4/5/6 com mesmo spawn e probabilidades.
- [ ] Regra de merge idêntica (um merge por linha por jogada).
- [ ] Score e best com mesma semântica de persistência.
- [ ] Undo com cópia de estado pré-movimento e limite 20.
- [ ] Vitória aos 2048 com fluxo “continuar”.
- [ ] Game over quando não há movimentos.
- [ ] Animações: durações e curvas conforme secção 5 (ajustáveis mas documentadas).
- [ ] Temas claro/dim com tokens da secção 8.
- [ ] Quatro paletas com hex exatos da secção 8.5.
- [ ] Tipografia Inter + Fraunces e hierarquia de tamanhos.
- [ ] Ícones e componentes conforme secção 8.9–8.10.

---

*Documento gerado a partir do código do repositório; alterações futuras ao código devem atualizar este ficheiro em conjunto.*
