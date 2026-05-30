import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAuthenticated, selectSessionRestored } from '@lankatax/data-access-auth';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectSessionRestored).pipe(
    filter((restored) => restored),
    take(1),
    map(() => {
      // After session is restored, check auth status synchronously
      let isAuthenticated = false;
      store.select(selectIsAuthenticated).pipe(take(1)).subscribe((v) => (isAuthenticated = v));
      if (isAuthenticated) return true;
      return router.createUrlTree(['/auth/login']);
    })
  );
};
