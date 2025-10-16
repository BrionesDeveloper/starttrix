import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable, of, defer } from 'rxjs';
import { ProductDto } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private readonly API_URL = '/api/Products';
  private readonly PLACEHOLDER = '/assets/placeholder.png';

  getProducts(): Observable<ProductDto[]> {
    return defer(() => {
      if (!isPlatformBrowser(this.platformId)) {
        return of<ProductDto[]>([]);
      }
      return this.http.get<any[]>(this.API_URL).pipe(
        map(items => items.map(this.mapToProductDto.bind(this)))
      );
    });
  }

  private mapToProductDto(item: any): ProductDto {
    return {
      id: item.code,
      name: `Product ${item.code}`,
      sku: item.code,
      imageUrl: (item.imageUrl?.trim() || this.PLACEHOLDER),
      footprintW: item.isComposed ? 3 : 2,
      footprintH: item.categoryId === 19 ? 1 : 2
    };
  }
}
