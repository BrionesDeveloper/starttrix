import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, fromEvent } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { GameInput } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class InputService {
  readonly inputs$ = new Subject<GameInput>();
  private platformId = inject(PLATFORM_ID);

  constructor(zone: NgZone) {
    if (!isPlatformBrowser(this.platformId)) return;

    zone.runOutsideAngular(() => {
      fromEvent<KeyboardEvent>(window, 'keydown')
        .pipe(
          map(ev => {
            switch (ev.key) {
              case 'ArrowLeft':  return GameInput.Left;
              case 'ArrowRight': return GameInput.Right;
              case 'ArrowDown':  return GameInput.Down;
              case 'ArrowUp':    return GameInput.Rotate;
              case ' ':          return GameInput.HardDrop;
              default:           return null;
            }
          }),
          filter((x): x is GameInput => x !== null)
        )
        .subscribe(input => this.inputs$.next(input));
    });
  }
}
