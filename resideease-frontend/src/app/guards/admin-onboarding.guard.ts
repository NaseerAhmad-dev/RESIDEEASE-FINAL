import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminOnboardingGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const user = auth.getUser();
  if (user?.role !== 'admin') return true;

  if (!auth.isOnboardingCompleted()) {
    return router.createUrlTree(['/admin/setup']);
  }

  return true;
};

export const setupPageGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  const user = auth.getUser();
  if (user?.role !== 'admin') {
    return router.createUrlTree(['/login']);
  }

  // If already onboarded, skip setup and go to dashboard
  if (auth.isOnboardingCompleted()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};
