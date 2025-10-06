import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LayoutService } from "../../shared/services/layout.service";
import { ApiBase } from "../../shared/bases/api-base";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { AuthService } from "../../shared/services/auth.service";

@Component({
  selector: 'app-login',
  imports: [ CommonModule, RouterModule, FormsModule, ReactiveFormsModule ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})

export class LoginComponent extends ApiBase implements OnInit {

  public show: boolean = false;
  public loginForm: FormGroup;
  public validate: boolean = false;

  private _layoutService = inject(LayoutService);
  private router = inject(Router);
  private toast = inject(ToastrService);
  private _authService = inject(AuthService);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
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

      const data = this.loginForm.getRawValue();

      this.post<any>('Account/login', data).subscribe({
        next: (res) => {
          this._layoutService.loading = false;
          if (res.errors?.errorCode) {
            this.toast.error(res.errors.message)
          } else {
            this._authService.setToken(res.data?.token);
            this._authService.userInfo = res.user;
            this.router.navigateByUrl('dashboard');
          }
        }
      });
    }
  }
}
