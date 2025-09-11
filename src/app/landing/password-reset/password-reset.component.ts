import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ApiBase } from "../../shared/bases/api-base";
import { LayoutService } from "../../shared/services/layout.service";
import { ToastrService } from "ngx-toastr";
import { mustMatch } from "../../shared/validators/must-match";

@Component({
  selector: 'app-password-reset',
  imports: [ CommonModule, RouterModule, ReactiveFormsModule ],
  templateUrl: './password-reset.component.html',
  styleUrl: './password-reset.component.scss'
})
export class PasswordResetComponent extends ApiBase implements OnInit {
  private _router = inject(Router);
  private _toast = inject(ToastrService);
  private _route = inject(ActivatedRoute);
  private _layoutService = inject(LayoutService);

  public form: FormGroup;
  public resetForm: FormGroup;

  id = signal<string>('');
  token = signal<string>('w');
  show = signal<boolean>(false);
  showConfirm = signal<boolean>(false);

  ngOnInit() {
    this.initForm();
    this.initResetForm();
    this.checkIfRedirectFromEmail();
  }

  checkIfRedirectFromEmail() {
    this._route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const rawToken = params.get('token');

      this.id.set(id ? id.trim() : null);
      this.token.set(rawToken ? decodeURIComponent(rawToken.trim()) : null);
      this.resetForm.get('id').setValue(this.id());
      this.resetForm.get('token').setValue(this.token());
    });
  }

  initForm() {
    this.form = new FormGroup({
      email: new FormControl("", [ Validators.required, Validators.email ])
    })
  }

  initResetForm() {
    this.resetForm = new FormGroup({
        newPassword: new FormControl("", [ Validators.required ]),
        confirmPassword: new FormControl("", [ Validators.required ]),
        token: new FormControl(''),
        id: new FormControl(''),
      },
      {
        validators: [
          mustMatch('newPassword', 'confirmPassword')
        ]
      })
  }

  send() {
    if (this.form.valid) {
      this._layoutService.loading = true;

      const data = this.form.getRawValue();

      this.post<any>('Account/CreatePasswordChangeUrl', data).subscribe({
        next: (res) => {
          this._layoutService.loading = false;
          if (res.errors?.errorCode) {
            this._toast.error(res.errors.message);
          } else {
            this._toast.success('A password reset link has been sent to your email');
          }
        }
      });
    }
  }

  reset() {
    if (this.resetForm.valid) {
      this._layoutService.loading = true;

      const data = this.resetForm.getRawValue();

      delete data.confirmPassword;

      this.post<any>('Account/ResetPassword', data).subscribe({
        next: (res) => {
          this._layoutService.loading = false;
          if (res.errors?.errorCode) {
            this._toast.error(res.errors.message);
          } else {
            this._toast.success('Your password has been successfully reset');
            this._router.navigateByUrl('/landing/auth').then();
          }
        },
        error: () => {
          this._layoutService.loading = false;
        }
      });
    }
  }

  showPassword() {
    this.show.set(!this.show());
  }

  showConfirmPassword() {
    this.showConfirm.set(!this.showConfirm());
  }
}
