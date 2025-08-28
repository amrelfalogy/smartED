import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminLayoutComponent } from '../../../admin-dashboard/layouts/admin-layouts/admin-layout/admin-layout.component';

@Component({
  selector: 'app-student-layout',
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.scss']
})
export class StudentLayoutComponent extends AdminLayoutComponent {
  constructor(router: Router) {
    super(router);
  }
}
