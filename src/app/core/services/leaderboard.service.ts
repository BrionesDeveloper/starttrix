import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ScoreEntryDto } from '../models/score.model';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private mockScores: ScoreEntryDto[] = [
    { displayName: 'Zelda', score: 340 },
    { displayName: 'Link', score: 320 },
    { displayName: 'Samus', score: 310 },
    { displayName: 'Peach', score: 300 },
    { displayName: 'Mario', score: 290 },
    { displayName: 'Luigi', score: 275 },
    { displayName: 'Pikachu', score: 260 },
    { displayName: 'Kirby', score: 250 },
    { displayName: 'Fox', score: 240 },
    { displayName: 'Yoshi', score: 230 }
  ];

  getTop10(): Observable<ScoreEntryDto[]> {
    return of(this.mockScores).pipe(delay(300));
  }
}
