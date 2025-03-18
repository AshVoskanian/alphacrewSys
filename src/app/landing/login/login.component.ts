import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LayoutService } from "../../shared/services/layout.service";

@Component({
  selector: 'app-login',
  imports: [ CommonModule, RouterModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent {

  public show: boolean = false;
  public loginForm: FormGroup;
  public validate: boolean = false;

  private _layoutService = inject(LayoutService);

  constructor(private fb: FormBuilder, public router: Router, private toast: ToastrService) {

    const userDetails = localStorage.getItem('user');
    if (userDetails?.length != null) {
      router.navigate([ '/dashboard/default' ])
    }

    this.loginForm = new FormGroup({
      email: new FormControl("", [ Validators.required, Validators.email ]),
      password: new FormControl("", Validators.required)
    })
  }

  showPassword() {
    this.show = !this.show;
  }

  login() {
    this.validate = true;
    if (this.loginForm.valid) {
      this._layoutService.loading = true;

      setTimeout(() => {
        this._layoutService.loading = false;
        this.router.navigate([ '/dashboard/default' ])
      }, 2000)
    }
  }
}
