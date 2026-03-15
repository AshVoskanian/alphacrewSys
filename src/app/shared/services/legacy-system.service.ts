import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';

const LEGACY_SYSTEM_KEY = 'legacySystem';

@Injectable({
  providedIn: 'root'
})
export class LegacySystemService {
  private readonly localStorage = inject(LocalStorageService);

  private readonly stored = this.localStorage.getItem<boolean>(LEGACY_SYSTEM_KEY);

  readonly isLegacySystem: WritableSignal<boolean> = signal(this.stored ?? false);

  toggle(): void {
    this.isLegacySystem.update(prev => {
      const next = !prev;
      this.localStorage.setItem(LEGACY_SYSTEM_KEY, next);
      return next;
    });
  }
}
