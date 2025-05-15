import { Component } from '@angular/core';
import { language } from '../../../../data/header';
import { Language } from '../../../../interface/header';
import { NavService } from '../../../../services/nav.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { menuItems } from "../../../../data/menu";
import { Menu } from "../../../../interface/menu";
import { SvgIconComponent } from "../../../ui/svg-icon/svg-icon.component";
import { Router, RouterModule } from "@angular/router";

@Component({
  selector: 'app-header-language',
  imports: [CommonModule, TranslateModule, SvgIconComponent, RouterModule],
  templateUrl: './header-language.component.html',
  styleUrl: './header-language.component.scss'
})

export class HeaderLanguageComponent {

  public languages = language;
  public selectedMenuItem: Menu;
  public selectedLanguage: Language;
  public menuItems = menuItems.filter(it => it.title);

  constructor(public navService: NavService, private translate: TranslateService, private router: Router) {
    this.languages.filter((details) => {
      if (details.active) {
        this.selectedLanguage = details
      }
    })
    this.setCurrentMenuItem();
  }

  setCurrentMenuItem() {
    const currentPath = this.router.url;

    this.selectedMenuItem = menuItems.find(item =>
      item.type === 'link' && item.path === currentPath
    );

    if (!this.selectedMenuItem) {
      const fullUrl = window.location.href;
      this.selectedMenuItem = menuItems.find(item =>
        item.type === 'extTabLink' && fullUrl.includes(item.path)
      );
    }
  }

  selectLanguage(language: Language) {
    this.selectedLanguage = language;
    this.translate.use(language.code)
  }

  selectedMenu(menuItem: Menu) {
    this.selectedMenuItem = menuItem;
  }
}
