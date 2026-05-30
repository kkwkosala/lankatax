import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectIsAdmin } from '@lankatax/data-access-auth';
import { take, map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsAdmin).pipe(
    take(1),
    map((isAdmin) => {
      if (isAdmin) return true;
      return router.createUrlTree(['/calculator']);
    })
  );
};
