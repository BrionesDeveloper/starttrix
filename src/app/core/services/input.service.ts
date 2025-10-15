import { Injectable } from '@angular/core';
import { fromEvent, merge, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { GameInput } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class InputService {
  private input$ = new Subject<GameInput>();

  constructor() {
    this.listenKeyboard();
    this.listenTouch();
  }

  get inputs$() {
    return this.input$.asObservable();
  }

  private listenKeyboard() {
    fromEvent<KeyboardEvent>(window, 'keydown').pipe(
      map(e => {
        switch (e.code) {
          case 'ArrowLeft': return GameInput.Left;
          case 'ArrowRight': return GameInput.Right;
          case 'ArrowDown': return GameInput.Down;
          case 'Space': return GameInput.HardDrop;
          case 'KeyR': return GameInput.Rotate;
          default: return null;
        }
      }),
      filter((v): v is GameInput => v !== null)
    ).subscribe(input => this.input$.next(input));
  }

  private listenTouch() {
    let startX = 0, startY = 0;
    fromEvent<TouchEvent>(window, 'touchstart').subscribe(e => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    });
    fromEvent<TouchEvent>(window, 'touchend').subscribe(e => {
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;

      if (Math.abs(dx) > Math.abs(dy)) {
        this.input$.next(dx > 0 ? GameInput.Right : GameInput.Left);
      } else if (Math.abs(dy) > 30) {
        this.input$.next(GameInput.Down);
      } else {
        this.input$.next(GameInput.Rotate);
      }
    });
  }
}
