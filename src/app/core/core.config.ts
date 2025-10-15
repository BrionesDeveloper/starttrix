import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { appRoutes } from '../app.routes';
import { httpApiUrlInterceptor } from './interceptors/http-apiurl.interceptor';
import { httpErrorInterceptor } from './interceptors/http-error.interceptor';

export const coreConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([httpApiUrlInterceptor, httpErrorInterceptor])
    )
  ]
};
