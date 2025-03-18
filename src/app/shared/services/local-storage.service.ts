import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  setItem<T = any>(key: string, value: T): void {
    const stringValue = JSON.stringify(value); // Convert to JSON string
    localStorage.setItem(key, stringValue);
  }

  getItem<T = any>(key: string): T | null {
    const stringValue = localStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) as T : null;
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
