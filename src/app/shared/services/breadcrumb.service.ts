import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {
  /** Display name for current detail page (Venue / Clients / Crew). Cleared when leaving. */
  readonly detailLabel: WritableSignal<string | null> = signal<string | null>(null);

  setDetailLabel(label: string | null): void {
    this.detailLabel.set(label);
  }
}
