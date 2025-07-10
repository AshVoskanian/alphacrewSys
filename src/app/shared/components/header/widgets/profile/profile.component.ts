import { Component, inject } from '@angular/core';
import { profile } from '../../../../data/header';
import { FeatherIconComponent } from "../../../ui/feather-icon/feather-icon.component";
import { RouterModule } from '@angular/router';
import { AuthService } from "../../../../services/auth.service";
import { AsyncPipe } from "@angular/common";
import { LocalStorageService } from "../../../../services/local-storage.service";

@Component({
  selector: 'app-profile',
  imports: [FeatherIconComponent,RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})

export class ProfileComponent {
  private _authService = inject(AuthService);
  private _localStorageService = inject(LocalStorageService);
  userInfo = JSON.parse(this._localStorageService.getItem('user')) || {};

  public profile = profile;

  logout() {
    this._authService.logout();
  }
}
