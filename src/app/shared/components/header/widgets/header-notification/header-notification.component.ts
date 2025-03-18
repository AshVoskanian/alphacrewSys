import { Component } from '@angular/core';
import { SvgIconComponent } from "../../../ui/svg-icon/svg-icon.component";
import { notification } from '../../../../data/header';

@Component({
  selector: 'app-header-notification',
  imports: [SvgIconComponent],
  templateUrl: './header-notification.component.html',
  styleUrl: './header-notification.component.scss'
})

export class HeaderNotificationComponent {

  public notifications = notification;

  removeNotification(id: number) {
    const index = this.notifications.findIndex((notification) => notification.id === id);

    if(index !== -1) {
      this.notifications.splice(index, 1);
    }
  }
  
}
