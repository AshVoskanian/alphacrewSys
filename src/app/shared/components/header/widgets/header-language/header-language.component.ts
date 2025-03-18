import { Component } from '@angular/core';
import { language } from '../../../../data/header';
import { Language } from '../../../../interface/header';
import { NavService } from '../../../../services/nav.service';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header-language',
  imports: [CommonModule],
  templateUrl: './header-language.component.html',
  styleUrl: './header-language.component.scss'
})

export class HeaderLanguageComponent {

  public languages = language;
  public selectedLanguage: Language;

  constructor(public navService: NavService, private translate: TranslateService) {
    this.languages.filter((details) => {
      if (details.active) {
        this.selectedLanguage = details
      }
    })
  }

  selectLanguage(language: Language) {
    this.selectedLanguage = language;
    this.translate.use(language.code)
  }

}
