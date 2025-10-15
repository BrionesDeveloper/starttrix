import { Injectable } from '@angular/core';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  preload(urls: string[]): Observable<{ url: string; ok: boolean }[]> {
    const loaders = urls.map(url => this.loadImage(url));
    return forkJoin(loaders);
  }

  private loadImage(url: string): Observable<{ url: string; ok: boolean }> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = () => {
        observer.next({ url, ok: true });
        observer.complete();
      };
      img.onerror = () => {
        observer.next({ url: '/assets/placeholder.png', ok: false });
        observer.complete();
      };
      img.src = url;
    });
  }
}
