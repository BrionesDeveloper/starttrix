import { InjectionToken } from '@angular/core';

export interface BoxProfile {
  width: number;
  height: number;
}

export const BOX_PROFILE = new InjectionToken<BoxProfile>('BOX_PROFILE', {
  factory: () => ({ width: 10, height: 20 }),
});

export const TICK_INTERVAL = new InjectionToken<number>('TICK_INTERVAL', {
  factory: () => 500, // gravity step in ms
});

export const POINTS = new InjectionToken('POINTS', {
  factory: () => ({
    piecePlaced: 10,
    closeBoxBonus: 50,
    fullBoardMultiplier: 2,
  }),
});
