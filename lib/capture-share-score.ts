import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

const OUT_W = 1080;
const OUT_H = 2160;

export async function captureShareScorePng(ref: RefObject<View | null>): Promise<string> {
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  return captureRef(ref, {
    format: 'png',
    quality: 1,
    width: OUT_W,
    height: OUT_H,
    result: 'tmpfile',
  });
}
