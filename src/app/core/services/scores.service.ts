import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ScoresService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  /** Guarda puntuación vía POST /api/Players con { name, points } */
  saveScore(displayName: string, score: number): Observable<{ ok: boolean }> {
    if (!isPlatformBrowser(this.platformId)) return of({ ok: false });
    const name = displayName?.trim();
    if (!name || Number.isNaN(score)) return of({ ok: false });

    if (!environment.useRealScoresApi) return of({ ok: true });

    const body = { name, points: Math.trunc(score) };

    return this.http.post('/api/Players', body, { headers: this.headers }).pipe(
      map(() => ({ ok: true })),
      catchError(err => {
        console.error('Score POST error', err);
        return of({ ok: false });
      })
    );
  }
}
