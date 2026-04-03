import { Routes } from '@angular/router';

export const tabsRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../dashboard/dashboard').then((m) => m.DashboardPage),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../profile/profile').then((m) => m.ProfilePage),
  },
  {
    path: 'saved',
    loadComponent: () =>
      import('../saved/saved').then((m) => m.SavedPage),
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
