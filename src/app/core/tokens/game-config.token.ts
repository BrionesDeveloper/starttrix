// app/core/tokens/game-config.token.ts
import { InjectionToken } from '@angular/core';

export interface GameConfig {
  rows: number;
  cols: number;
  tickMs: number;
  initialLives: number;
  placeScore: number;       
  closeBoxScore: number;    
  fullBoxMultiplier: number; 
}

export const GAME_CONFIG = new InjectionToken<GameConfig>('GAME_CONFIG');
