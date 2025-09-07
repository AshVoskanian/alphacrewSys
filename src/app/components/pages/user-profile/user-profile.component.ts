import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

import { CardComponent } from "../../../shared/components/ui/card/card.component";
import { Tabs } from "../../../shared/interface/common";
import { UserDetailsComponent } from "./user-details/user-details.component";
import { ChangePasswordComponent } from "./change-password/change-password.component";

@Component({
  selector: 'app-user-profile',
  imports: [ NgbNavModule, CardComponent, UserDetailsComponent, ChangePasswordComponent ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss'
})

export class UserProfileComponent {

  public activeTab: string = 'change-password';
  public userDetailsTab: Tabs[] = [
    {
      id: 1,
      title: 'User',
      value: 'user',
      icon: 'fa-solid fa-user'
    },
    {
      id: 2,
      title: 'Change Password',
      value: 'change-password',
      icon: 'fa-solid fa-lock'
    },
  ];

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {

  }

}
