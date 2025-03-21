import { inject, Injectable } from '@angular/core';
import { SessionStorageService } from "./session-storage.service";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { LocalStorageService } from "./local-storage.service";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private newlyCreatedUser$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private tokenKey = 'authToken';

  private router = inject(Router);
  private sessionStorageService = inject(SessionStorageService);
  private localStorageService = inject(LocalStorageService);

  get newlyCreatedUser(): Observable<string> {
    return this.newlyCreatedUser$.asObservable()
  }

  set newlyCreatedUser(user: string) {
    this.newlyCreatedUser$.next(user);
  }

  getToken(): string | null {
    return this.localStorageService.getItem<string>(this.tokenKey);
  }

  logout() {
    this.sessionStorageService.clear();
    this.localStorageService.clear();
    this.router.navigateByUrl('landing/auth').then();
  }

  setToken(token: string) {
    this.localStorageService.setItem<string>(this.tokenKey, token);
  }
}
