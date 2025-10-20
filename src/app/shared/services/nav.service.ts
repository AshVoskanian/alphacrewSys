import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";
import { Schedule } from "../interface/schedule";

@Injectable({
  providedIn: 'root'
})

export class NavService {

  public isLanguage: boolean = false;
  public fullScreen: boolean = false;
  public isSearchOpen: boolean = false;
  public days: number = 2;
  public regionId: number = 0;

  public filterParams: BehaviorSubject<{date: NgbDateStruct, jobId: number}> = new BehaviorSubject<any>(null);
  public listView$: BehaviorSubject<'list' | 'grid'> = new BehaviorSubject<'list' | 'grid'>('list');
  public scrollTo$: BehaviorSubject<Schedule> = new BehaviorSubject<Schedule>(null);

  constructor() {
  }

}
