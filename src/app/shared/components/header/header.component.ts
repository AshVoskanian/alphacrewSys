import { Component, inject } from '@angular/core';
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
import { NgbDateStruct, NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from "ng-select2-component";

@Component({
  selector: 'app-header',
  imports: [HeaderLogoComponent, HeaderNoticeComponent, HeaderLanguageComponent,
            ToggleScreenComponent, SvgIconComponent, SearchComponent, Select2Module,
            HeaderBookmarkComponent, ModeComponent, ReactiveFormsModule,
            HeaderNotificationComponent, ProfileComponent, NgbInputDatepicker],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  private _fb = inject(FormBuilder);

  isScheduleRoute = false;

  regions = [
    {
      label: 'All',
      value: 0
    },
    {
      label: 'London',
      value: 1
    },
    {
      label: 'Birm/Man',
      value: 2
    },
    {
      label: 'Bristol',
      value: 6
    },
    {
      label: 'Scotland',
      value: 7
    },
    {
      label: 'Nice',
      value: 3
    },
    {
      label: 'Paris',
      value: 4
    },
    {
      label: 'Barcelona',
      value: 8
    },
    {
      label: 'NewYork',
      value: 10
    },
    {
      label: 'SECURITY',
      value: 9
    },
  ]

  form: FormGroup;
  constructor(public navService: NavService, private router: Router) {
    this.initForm();
    this.router.events.subscribe(() => {
      this.isScheduleRoute = this.router.url?.includes('/schedule');
    });
  }

  initForm() {
    const today = new Date();
    const initialDate: NgbDateStruct = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };

    this.form = this._fb.group({
      date: [ initialDate, [ Validators.required ] ]
    });

    this.navService.date$.next(this.form.get('date')?.value);
  }

  toggleLanguage() {
    this.navService.isLanguage =! this.navService.isLanguage;
  }

  submit() {
    if (this.form.valid) {
      this.navService.date$.next(this.form.get('date')?.value);
    }
  }

  setDays(days: number) {
    this.navService.days = days;
    this.submit();
  }

  setRegion(e: Select2UpdateEvent<Select2UpdateValue>) {
    this.navService.regionId = +e.value;
    this.submit();
  }
}
