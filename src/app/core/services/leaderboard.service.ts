import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, defer, map } from 'rxjs';
import { ScoreEntryDto } from '../models/score.model';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  getTop10(): Observable<ScoreEntryDto[]> {
    return defer(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return of<ScoreEntryDto[]>([]);
      }
      return this.http.get<ScoreEntryDto[]>('/api/Players').pipe(
        map(players => [...players].sort((a, b) => b.score - a.score).slice(0, 10))
      );
    });
  }
}
