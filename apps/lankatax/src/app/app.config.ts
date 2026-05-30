import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { isDevMode } from '@angular/core';
import { routes } from './app.routes';
import { authReducer } from '@lankatax/data-access-auth';
import { AuthEffects } from '@lankatax/data-access-auth';
import { calculatorReducer } from '@lankatax/data-access-calculator';
import { CalculatorEffects } from '@lankatax/data-access-calculator';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideStore({
      auth: authReducer,
      calculator: calculatorReducer,
    }),
    provideEffects([AuthEffects, CalculatorEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      autoPause: true,
    }),
  ],
};
