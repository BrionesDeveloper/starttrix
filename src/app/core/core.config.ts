// src/app/core/core.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { appRoutes } from '../app.routes';
import { httpApiUrlInterceptor } from './interceptors/http-apiurl.interceptor';
import { httpErrorInterceptor } from './interceptors/http-error.interceptor';
import {
  BOX_PROFILE, POINTS, TICK_INTERVAL, THRESHOLD_ROW, THRESHOLD_HEIGHT,
  AUTOSAVE_MS, GAME_TIME_MS, BoxProfile, PointsProfile
} from './tokens';

const boxDefaults: BoxProfile   = { width: 10, height: 20 };
const pointsDefaults: PointsProfile = { placePiece: 10, closeBox: 50, fullBoxMultiplier: 10 };

export const coreConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([httpApiUrlInterceptor, httpErrorInterceptor]), withFetch()),
    provideNoopAnimations(),
    importProvidersFrom(MatSnackBarModule),

    { provide: BOX_PROFILE,     useValue: boxDefaults },
    { provide: POINTS,          useValue: pointsDefaults },
    { provide: TICK_INTERVAL,   useValue: 600 },

    // La franja de 4 filas empieza en la 16 -> abarca 16,17,18,19
    { provide: THRESHOLD_ROW,    useValue: 16 },
    { provide: THRESHOLD_HEIGHT, useValue: 4 },

    { provide: AUTOSAVE_MS,     useValue: 15000 },
    { provide: GAME_TIME_MS,    useValue: 60000 },
  ]
};
