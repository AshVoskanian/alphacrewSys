import { Component, inject } from '@angular/core';
import { HeaderLogoComponent } from "./widgets/header-logo/header-logo.component";
import { HeaderLanguageComponent } from "./widgets/header-language/header-language.component";
import { NavService } from '../../services/nav.service';
import { SearchComponent } from "./widgets/search/search.component";
import { ProfileComponent } from "./widgets/profile/profile.component";
import { NgbDateStruct, NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from "ng-select2-component";
import { LocalStorageService } from "../../services/local-storage.service";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: 'app-header',
  imports: [
    HeaderLogoComponent, HeaderLanguageComponent, SearchComponent,
    Select2Module, ReactiveFormsModule,
    ProfileComponent, NgbInputDatepicker, AsyncPipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent {
  private router: Router = inject(Router);
  private _fb = inject(FormBuilder);
  private _localStorageService = inject(LocalStorageService);

  public navService: NavService = inject(NavService);

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

  userInfo = JSON.parse(this._localStorageService.getItem('user')) || {};

  form: FormGroup;

  constructor() {
    this.initForm();
    this.router.events.subscribe(() => {
      this.isScheduleRoute = this.router.url?.includes('/schedule');
    });
    this.filterRegionsByRole();
    this.checkListView();
  }

  checkListView() {
    const view = this._localStorageService.getItem('listView') as 'grid' | 'list';

    if (!view) {
      this._localStorageService.setItem('listView', 'list');
      this.setListView('list');
    } else {
      this.setListView(view);
    }
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

  filterRegionsByRole() {
    const roleRegionsIds = this.userInfo?.userRegions?.map(reg => reg.value);

    this.regions = this.regions.filter(region => roleRegionsIds?.includes(region.value) || region.value === 0);
  }

  toggleLanguage() {
    this.navService.isLanguage = !this.navService.isLanguage;
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

  setListView(viewType: 'list' | 'grid') {
    this._localStorageService.setItem('listView', viewType);
    this.navService.listView$.next(viewType);
  }
}
