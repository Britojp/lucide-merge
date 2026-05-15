import type { PaletteName } from '@/constants/theme';

export type ShareCardTemplateId = 'vertical_hero' | 'vertical_achievement';

export const SHARE_CARD_TEMPLATE_STORAGE_KEY = 'lucid.share-card-template';

export const SHARE_CARD_TEMPLATE_OPTIONS: {
  id: ShareCardTemplateId;
  title: string;
  hint: string;
  designReference: string;
}[] = [
  {
    id: 'vertical_hero',
    title: 'Vertical hero',
    hint: 'Destaque da pontuação, mosaico de peças, tabuleiro completo',
    designReference: 'image_export/01 _ Vertical hero.html',
  },
  {
    id: 'vertical_achievement',
    title: 'Vertical achievement',
    hint: 'Peça máxima em destaque, linha de história, tabuleiro completo',
    designReference: 'image_export/02 _ Vertical achievement.html',
  },
];

export const SHARE_CARD_PALETTE_TAGLINE: Record<PaletteName, string> = {
  pastel: 'the soft spread.',
  sand: 'the drift.',
  mist: 'the haze.',
  bloom: 'the bloom.',
};
