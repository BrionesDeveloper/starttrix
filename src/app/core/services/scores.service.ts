import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ScoresService {
  constructor(private http: HttpClient) {}

  saveScore(displayName: string, score: number): Observable<{ id: string }> {
    if (environment.useRealScoresApi) {
      return this.http.post<{ id: string }>('/api/v1/scores', { displayName, score });
    }

    return of({ id: crypto.randomUUID() }).pipe(delay(200));
  }
}
