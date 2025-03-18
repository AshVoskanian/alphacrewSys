import { Component } from '@angular/core';
import { HeaderLogoComponent } from "./widgets/header-logo/header-logo.component";
import { HeaderNoticeComponent } from "./widgets/header-notice/header-notice.component";
import { HeaderLanguageComponent } from "./widgets/header-language/header-language.component";
import { NavService } from '../../services/nav.service';
import { ToggleScreenComponent } from "./widgets/toggle-screen/toggle-screen.component";
import { SvgIconComponent } from "../ui/svg-icon/svg-icon.component";
import { SearchComponent } from "./widgets/search/search.component";
import { HeaderBookmarkComponent } from "./widgets/header-bookmark/header-bookmark.component";
import { ModeComponent } from "./widgets/mode/mode.component";
import { HeaderNotificationComponent } from "./widgets/header-notification/header-notification.component";
import { ProfileComponent } from "./widgets/profile/profile.component";

@Component({
  selector: 'app-header',
  imports: [HeaderLogoComponent, HeaderNoticeComponent, HeaderLanguageComponent,
            ToggleScreenComponent, SvgIconComponent, SearchComponent,
            HeaderBookmarkComponent, ModeComponent, 
            HeaderNotificationComponent, ProfileComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {

  constructor(private navService: NavService) {}

  toggleLanguage() {
    this.navService.isLanguage =! this.navService.isLanguage;
  }

  openSearch() {
    this.navService.isSearchOpen = true;
  }
  
}
