import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ProductDto } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<ProductDto[]> {
    return this.http.get<ProductDto[]>('/api/v1/products').pipe(
      map(products =>
        products.map(p => ({
          ...p,
          imageUrl: p.imageUrl?.trim() || '/assets/placeholder.png'
        }))
      )
    );
  }
}
