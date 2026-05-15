export const ONBOARDING_STORAGE_KEY = 'lucid.onboarding-v1';

export type OnboardingStep = {
  title: string;
  body: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    title: 'Welcome to Lucid Merge',
    body:
      'A calm take on the merge puzzle: swipe the board, combine matching tiles, and climb toward huge numbers. '
      + 'This short tour walks through everything the app offers — you can skip anytime.',
  },
  {
    title: 'How you play',
    body:
      'Swipe up, down, left, or right. All tiles slide. Identical values merge into one tile worth double. '
      + 'Each move spawns a new piece on the board. Plan a few steps ahead to keep space open.',
  },
  {
    title: 'Score & personal best',
    body:
      'SCORE is your current run. BEST is your top score for the current grid size and game mode. '
      + 'Changing the grid or mode in Settings tracks separate bests where it applies.',
  },
  {
    title: 'Game modes',
    body:
      'Under the title you will see chips for the active mode — for example Classic, Time Attack, Zen, Daily, Moves, or Hard. '
      + 'Some modes add a countdown, a move cap, blocked cells, or gentler loss rules. Open Settings to switch modes; '
      + 'the first time you pick a mode, a short sheet explains that mode.',
  },
  {
    title: 'The bottom toolbar',
    body:
      'Restart starts a fresh board. Undo takes back your last move (limited per run). The sun/moon icon toggles light and dim theme. '
      + 'Settings opens grid size, mode, colors, tile style, numbers on tiles, and sound. Help opens the full rulebook and a mode-by-mode guide.',
  },
  {
    title: 'Leaderboard & account',
    body:
      'The trophy opens the leaderboard — compare bests with other players by grid size. '
      + 'The profile icon opens your profile when signed in, or sign-in when you are playing as a guest. '
      + 'Signing in syncs your best scores to the cloud and unlocks online rankings and progression.',
  },
  {
    title: 'Profile: XP, missions & achievements',
    body:
      'After you sign in, Profile shows your level and XP, today’s missions, and achievements you can unlock by playing. '
      + 'You can edit your display name there and sign out when you need to.',
  },
  {
    title: 'Timed modes & START',
    body:
      'In Time Attack, the clock only runs after you tap START in the center of the board — use that moment to plan. '
      + 'Other timed or limited-move modes show their limits in the chip row so you always know what applies.',
  },
  {
    title: 'Share your run',
    body:
      'Use Share run to send a compact summary of your session (mode, grid, seed, moves, score). '
      + 'Handy for bragging rights or saving a memorable game.',
  },
  {
    title: 'When a run ends',
    body:
      'On game over or when you hit the win tile, overlays offer Continue, Restart, or — if you are signed in and have a saved best — '
      + 'Watch best run to replay your top score as a ghost on the board. '
      + 'That is the full picture. Tap Get started and enjoy the drift.',
  },
];
