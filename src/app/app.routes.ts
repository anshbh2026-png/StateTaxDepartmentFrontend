import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { DealerForgetPassComponent } from './components/dealer-forgetpass/dealer-forgetpass.component';
import { AsmtComponent } from './components/asmt/asmt';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dealer-forgetpass', component: DealerForgetPassComponent },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'asmt', component: AsmtComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];