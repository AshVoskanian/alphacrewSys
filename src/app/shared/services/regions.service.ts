import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";
import { Select2Option } from "ng-select2-component";

@Injectable({
  providedIn: 'root'
})
export class RegionsService {

  regions$: BehaviorSubject<Select2Option[]> = new BehaviorSubject<Select2Option[]>([]);

  constructor() { }

  get regions() {
    return this.regions$.asObservable()
  }

  set regionsData(value: Select2Option[]) {
    this.regions$.next(value);
  }
}
