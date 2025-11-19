import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HeaderLogoComponent } from "./widgets/header-logo/header-logo.component";
import { HeaderLanguageComponent } from "./widgets/header-language/header-language.component";
import { NavService } from '../../services/nav.service';
import { ProfileComponent } from "./widgets/profile/profile.component";
import { NgbDateStruct, NgbInputDatepicker } from "@ng-bootstrap/ng-bootstrap";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { Select2Module, Select2UpdateEvent, Select2UpdateValue } from "ng-select2-component";
import { LocalStorageService } from "../../services/local-storage.service";
import { AsyncPipe } from "@angular/common";
import { FeatherIconComponent } from "../ui/feather-icon/feather-icon.component";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ApiBase } from "../../bases/api-base";
import { GeneralService } from "../../services/general.service";
import { Region } from "../../interface/header";
import { finalize } from "rxjs";

@Component({
  selector: 'app-header',
  imports: [
    RouterModule,
    HeaderLogoComponent, HeaderLanguageComponent, Select2Module, ReactiveFormsModule,
    ProfileComponent, NgbInputDatepicker, AsyncPipe, FeatherIconComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})

export class HeaderComponent extends ApiBase implements OnInit {
  private _router = inject(Router);
  private _dr = inject(DestroyRef);
  private _fb = inject(FormBuilder);
  private _activatedRouter = inject(ActivatedRoute);
  private _localStorageService = inject(LocalStorageService);

  public navService: NavService = inject(NavService);

  regionLoading = false;
  isScheduleRoute = false;

  regions = [];

  form: FormGroup;

  queryParams = toSignal(this._activatedRouter.queryParamMap)

  ngOnInit() {
    this.initForm();
    this._router.events.subscribe(() => {
      this.isScheduleRoute = this._router.url?.includes('/schedule');
    });
    this.getRegions();
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

    this.navService.filterParams.next({ date: this.form.get('date')?.value, jobId: +this.queryParams().get('jobId') });
  }

  getRegions() {
    this.regionLoading = true;

    this.get<Region[]>('Schedule/GetJobRegions')
      .pipe(takeUntilDestroyed(this._dr), finalize(() => this.regionLoading = false))
      .subscribe({
        next: res => {
          if (res.errors?.errorCode) {
            GeneralService.showErrorMessage(res.errors.message);
            return;
          }

          this.regions = res.data.map(reg => ({ label: reg.regionText, value: reg.jobRegionId }));
          this.regions.unshift({ label: 'All', value: 0 });
        }
      })
  }

  toggleLanguage() {
    this.navService.isLanguage = !this.navService.isLanguage;
  }

  submit() {
    if (this.form.valid) {
      this.navService.filterParams.next({
        date: this.form.get('date')?.value,
        jobId: +this.queryParams().get('jobId')
      });
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

  resetJobIdFilter() {
    const queryParams = {};
    this._router.navigate([ 'schedule' ], { queryParams }).then();
    setTimeout(() => this.submit());
  }
}
