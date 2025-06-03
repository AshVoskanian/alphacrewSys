import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";
import { NgbDateStruct } from "@ng-bootstrap/ng-bootstrap";

@Injectable({
  providedIn: 'root'
})

export class NavService {

  public isLanguage: boolean = false;
  public fullScreen: boolean = false;
  public isSearchOpen: boolean = false;
  public days: number = 2;

  public date$: BehaviorSubject<NgbDateStruct> = new BehaviorSubject<any>(null);

  constructor() { }

}
