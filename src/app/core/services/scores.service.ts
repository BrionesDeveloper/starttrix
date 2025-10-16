import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, defer, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ScoresService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  saveScore(displayName: string, score: number): Observable<{ ok: boolean }> {
    // si el back valida no vacíos, evita mandar basura
    if (!isPlatformBrowser(this.platformId) || !displayName?.trim() || typeof score !== 'number') {
      return of({ ok: false });
    }
    const body = { name: displayName.trim(), score };

    if (!environment.useRealScoresApi) return of({ ok: true });

    return this.http.post('/api/Players', body, { headers: this.headers }).pipe(
      map(() => ({ ok: true })),
      catchError(err => {
        console.error('Score POST error', err);
        return of({ ok: false });
      })
    );
  }
}
