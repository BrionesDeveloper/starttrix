import { HttpInterceptorFn } from '@angular/common/http';

export const httpApiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Absoluta => no tocar
  if (/^https?:\/\//i.test(req.url)) return next(req);
  // /api/... => deja que lo resuelva el proxy
  if (req.url.startsWith('/api')) return next(req);

  // Para otras rutas internas podrías anteponer base si lo necesitas
  return next(req);
};
