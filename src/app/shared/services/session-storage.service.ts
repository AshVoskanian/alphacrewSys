import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStorageService {
  setItem<T = any>(key: string, value: T): void {
    const stringValue = JSON.stringify(value); // Convert to JSON string
    sessionStorage.setItem(key, stringValue);
  }

  getItem<T = any>(key: string): T | null {
    const stringValue = sessionStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) as T : null;
  }

  removeItem(key: string): void {
    sessionStorage.removeItem(key);
  }

  clear(): void {
    sessionStorage.clear();
  }
}
