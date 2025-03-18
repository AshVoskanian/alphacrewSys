import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LayoutService } from '../../../../services/layout.service';
import { FeatherIconComponent } from "../../../ui/feather-icon/feather-icon.component";

@Component({
  selector: 'app-header-logo',
  imports: [RouterModule, FeatherIconComponent],
  templateUrl: './header-logo.component.html',
  styleUrl: './header-logo.component.scss'
})

export class HeaderLogoComponent {

  @Input() icon: string;
  @Input() type: string;
  
  constructor(public layoutService: LayoutService) {}

  toggleSidebar() {
    this.layoutService.closeSidebar =! this.layoutService.closeSidebar;
  }
  
}
