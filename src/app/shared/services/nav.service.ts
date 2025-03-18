import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class NavService {

  public isLanguage: boolean = false;
  public fullScreen: boolean = false;
  public isSearchOpen: boolean = false;
  
  constructor() { }
  
}
