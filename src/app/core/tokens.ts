import { InjectionToken } from '@angular/core';

export interface BoxProfile { width: number; height: number; }
export interface PointsProfile { placePiece: number; closeBox: number; fullBoxMultiplier: number; }

export const BOX_PROFILE   = new InjectionToken<BoxProfile>('BOX_PROFILE');
export const POINTS        = new InjectionToken<PointsProfile>('POINTS');
export const TICK_INTERVAL = new InjectionToken<number>('TICK_INTERVAL');


export const THRESHOLD_ROW = new InjectionToken<number>('THRESHOLD_ROW');
export const THRESHOLD_HEIGHT = new InjectionToken<number>('THRESHOLD_HEIGHT');

export const AUTOSAVE_MS   = new InjectionToken<number>('AUTOSAVE_MS');

export const GAME_TIME_MS  = new InjectionToken<number>('GAME_TIME_MS');
