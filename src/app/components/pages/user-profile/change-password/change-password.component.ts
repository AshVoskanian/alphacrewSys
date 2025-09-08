import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from "@angular/forms";
import { CommonModule, NgClass } from "@angular/common";
import { ApiBase } from "../../../../shared/bases/api-base";
import { Notification } from "../../../../shared/interface/schedule";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { GeneralService } from "../../../../shared/services/general.service";
import { HttpClient } from "@angular/common/http";
import { mustMatch } from "../../../../shared/validators/must-match";

@Component({
  selector: 'app-change-password',
  imports: [
    CardComponent,
    NgClass,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent extends ApiBase implements OnInit {
  private _dr = inject(DestroyRef);

  public strengthPercent = 0;
  public strengthClass = 'bg-danger';
  public loader = false;

  public passwordValid = {
    lowerUpper: false,
    number: false,
    special: false,
    length: false
  };

  form = new FormGroup({
    currentPassword: new FormControl('', [ Validators.required ]),
    newPassword: new FormControl('', Validators.required,),
    confirmPassword: new FormControl('', Validators.required,),
  })

  constructor(private fb: FormBuilder, public override http: HttpClient) {
    super(http);
    this.form = this.fb.group(
      {
        currentPassword: [ '', [ Validators.required ] ],
        newPassword: [ '', [ Validators.required, Validators.minLength(6) ] ],
        confirmPassword: [ '', [ Validators.required ] ]
      },
      {
        validators: [
          mustMatch('newPassword', 'confirmPassword')
        ]
      }
    );
  }

  ngOnInit() {
    this.checkStrength();
  }

  private passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPass = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return newPass === confirm ? null : { passwordsMismatch: true };
  }

  submit() {
    this.form.markAllAsTouched();

    if (this.form.valid) {
      this.changePassword();
    }
  }

  changePassword() {
    const { currentPassword, newPassword } = this.form.getRawValue();

    if (this.loader) return;

    this.loader = true;

    this.post<Array<Notification>>(`Account/ChangePasswordAsync?currentPassword=${ currentPassword }&newPassword=${ newPassword }`, null)
      .pipe(takeUntilDestroyed(this._dr))
      .subscribe({
        next: (res) => {
          this.loader = false;

          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          GeneralService.showSuccessMessage();
        }
      })
  }

  get currentPassword() {
    return this.form.get('currentPassword');
  }

  get confirmPassword() {
    return this.form.get('confirmPassword');
  }

  get newPassword() {
    return this.form.get('newPassword');
  }

  checkStrength() {
    const password = this.newPassword?.value || '';
    let score = 0;

    this.passwordValid.lowerUpper = /[a-z]/.test(password) && /[A-Z]/.test(password);
    this.passwordValid.number = /\d/.test(password);
    this.passwordValid.special = /[@$!%*?&]/.test(password);
    this.passwordValid.length = password.length >= 8;

    if (this.passwordValid.lowerUpper) score++;
    if (this.passwordValid.number) score++;
    if (this.passwordValid.special) score++;
    if (this.passwordValid.length) score++;

    this.strengthPercent = (score / 4) * 100;

    switch (score) {
      case 0:
      case 1:
        this.strengthClass = 'bg-danger';
        break;
      case 2:
        this.strengthClass = 'bg-danger';
        break;
      case 3:
        this.strengthClass = 'bg-warning';
        break;
      case 4:
        this.strengthClass = 'bg-success';
        break;
    }
  }
}
