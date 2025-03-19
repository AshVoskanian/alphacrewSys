import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LayoutService } from "../../shared/services/layout.service";
import { ApiBase } from "../../shared/bases/api-base";

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
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastrService);

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    const userDetails = localStorage.getItem('user');
    if (userDetails?.length != null) {
      this.router.navigate([ '/dashboard/default' ])
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

      const data = this.loginForm.getRawValue();

      this.post('Account/login', data).subscribe({
        next: (res) => {
          this._layoutService.loading = false;
          if (res.errors?.errorCode) {
            this.toast.error(res.errors.message)
          } else {
            this.router.navigateByUrl('dashboard/default')
          }
        }
      });
    }
  }
}
