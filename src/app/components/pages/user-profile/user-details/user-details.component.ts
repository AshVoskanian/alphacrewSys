import { Component, inject } from '@angular/core';
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { SvgIconComponent } from "../../../../shared/components/ui/svg-icon/svg-icon.component";
import { LocalStorageService } from "../../../../shared/services/local-storage.service";

@Component({
  selector: 'app-user-details',
  imports: [
    CardComponent,
    SvgIconComponent
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss'
})
export class UserDetailsComponent {
  private _localStorageService = inject(LocalStorageService);
  userInfo = JSON.parse(this._localStorageService.getItem('user')) || {};
}
