import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const httpApiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('http') && !req.url.startsWith('/assets/')) {
    const url = `${environment.apiBaseUrl}${req.url}`;
    req = req.clone({ url });
  }
  return next(req);
};
