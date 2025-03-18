import { Component } from '@angular/core';
import { profile } from '../../../../data/header';
import { FeatherIconComponent } from "../../../ui/feather-icon/feather-icon.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [FeatherIconComponent,RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})

export class ProfileComponent {

  public profile = profile;

  
}
