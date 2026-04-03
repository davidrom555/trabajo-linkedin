import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./features/tabs/tabs').then((m) => m.TabsPage),
    loadChildren: () =>
      import('./features/tabs/tabs.routes').then((m) => m.tabsRoutes),
  },
];
