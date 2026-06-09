import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./admin/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'students/add',
        loadComponent: () => import('./admin/add-student/add-student.component').then(m => m.AddStudentComponent)
      },
      {
        path: 'students/view/:id',
        loadComponent: () => import('./admin/students/student-view.component').then(m => m.StudentViewComponent)
      },
      {
        path: 'rooms',
        loadComponent: () => import('./admin/rooms/rooms.component').then(m => m.RoomsComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./admin/employees/employees.component').then(m => m.EmployeesComponent)
      },
      {
        path: 'mess',
        loadComponent: () => import('./admin/mess/mess.component').then(m => m.MessComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./admin/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'notices',
        loadComponent: () => import('./components/notices/notices-board.component').then(m => m.NoticesBoardComponent),
        data: { postedBy: 'Office Admin' }
      },
      {
        path: 'requests',
        loadComponent: () => import('./admin/requests/maintenance-requests.component').then(m => m.MaintenanceRequestsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./admin/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: 'student',
    children: [
      {
        path: 'profile/:id',
        loadComponent: () => import('./student/student-profile.component').then(m => m.StudentProfileComponent)
      }
    ]
  },
  {
    path: 'manager',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: '',
        loadComponent: () => import('./manager/manager-shell/manager-shell.component').then(m => m.ManagerShellComponent),
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./manager/manager-dashboard.component').then(m => m.ManagerDashboardComponent)
          },
          {
            path: 'mess',
            loadComponent: () => import('./manager/mess/manager-mess.component').then(m => m.ManagerMessComponent)
          },
          {
            path: 'rebates',
            loadComponent: () => import('./manager/rebates/manager-rebates.component').then(m => m.ManagerRebatesComponent)
          },
          {
            path: 'notices',
            loadComponent: () => import('./components/notices/notices-board.component').then(m => m.NoticesBoardComponent),
            data: { postedBy: 'Mess Manager' }
          },
          {
            path: 'bills',
            loadComponent: () => import('./manager/bills/manager-bills.component').then(m => m.ManagerBillsComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./manager/settings/manager-settings.component').then(m => m.ManagerSettingsComponent)
          },
          {
            path: 'audit',
            loadComponent: () => import('./manager/audit/manager-audit.component').then(m => m.ManagerAuditComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'onboarding',
    children: [
      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome',        loadComponent: () => import('./components/welcome/welcome.component').then(m => m.WelcomeComponent) },
      { path: 'user-details',   loadComponent: () => import('./components/user-details/user-details.component').then(m => m.UserDetailsComponent) },
      { path: 'room-selection', loadComponent: () => import('./components/room-selection/room-selection.component').then(m => m.RoomSelectionComponent) },
      { path: 'mess-selection', loadComponent: () => import('./components/mess-selection/mess-selection.component').then(m => m.MessSelectionComponent) },
      { path: 'confirmation',   loadComponent: () => import('./components/confirmation/confirmation.component').then(m => m.ConfirmationComponent) }
    ]
  },
  {
    path: 'guest',
    children: [
      { path: '', redirectTo: 'register', pathMatch: 'full' },
      {
        path: 'register',
        loadComponent: () => import('./guest/guest-register.component').then(m => m.GuestRegisterComponent)
      }
    ]
  },
  {
    path: 'super-admin',
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: '',
        loadComponent: () => import('./super-admin/super-admin-shell/super-admin-shell.component').then(m => m.SuperAdminShellComponent),
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./super-admin/super-admin-dashboard/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent)
          },
          {
            path: 'hostels',
            loadComponent: () => import('./super-admin/super-admin-hostels/super-admin-hostels.component').then(m => m.SuperAdminHostelsComponent)
          },
          {
            path: 'hostels/:id',
            loadComponent: () => import('./super-admin/super-admin-hostel-detail/super-admin-hostel-detail.component').then(m => m.SuperAdminHostelDetailComponent)
          }
        ]
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
