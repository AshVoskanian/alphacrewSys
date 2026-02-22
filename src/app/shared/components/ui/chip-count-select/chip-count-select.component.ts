import {
  Component,
  computed,
  inject,
  input,
  signal,
  WritableSignal
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ChipCountItem, ChipCountOption } from './chip-count-select.model';

@Component({
  selector: 'app-chip-count-select',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: ChipCountSelectComponent,
      multi: true
    }
  ],
  templateUrl: './chip-count-select.component.html',
  styleUrl: './chip-count-select.component.scss'
})
export class ChipCountSelectComponent implements ControlValueAccessor {
  /** Full list of options (id + label) to choose from. */
  options = input.required<ChipCountOption[]>();

  /** Placeholder for the dropdown when no selection. */
  placeholder = input<string>('აირჩიეთ...');

  /** Minimum count per chip (default 1). When decremented below, item is removed. */
  minCount = input<number>(1);

  /** Whether the control is disabled (from template). */
  disabled = input<boolean>(false);

  /** Disabled state set by form control (CVA). */
  private disabledByControl = signal<boolean>(false);

  /** Effective disabled: input or CVA. */
  isDisabled = computed(() => this.disabled() || this.disabledByControl());

  /** Current value: array of { id, count }. */
  value: WritableSignal<ChipCountItem[]> = signal<ChipCountItem[]>([]);

  /** Selected option id for the dropdown (used for adding). */
  selectedOptionId = signal<number | null>(null);

  /** Options that are not yet in value (available in dropdown). */
  availableOptions = computed(() => {
    const opts = this.options();
    const selectedIds = new Set(this.value().map((v) => v.id));
    return opts.filter((o) => !selectedIds.has(o.id));
  });

  /** Chips to display: value enriched with label from options. */
  chipsWithLabel = computed(() => {
    const opts = this.options();
    const map = new Map(opts.map((o) => [o.id, o.label]));
    return this.value().map((item) => ({
      ...item,
      label: map.get(item.id) ?? `#${item.id}`
    }));
  });

  private onTouched: () => void = () => {};
  private onChange: (value: ChipCountItem[]) => void = () => {};

  writeValue(raw: ChipCountItem[] | null | undefined): void {
    const arr = Array.isArray(raw) ? raw : [];
    this.value.set(arr.map((x) => ({ id: x.id, count: Math.max(this.minCount(), x.count) })));
  }

  registerOnChange(fn: (value: ChipCountItem[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByControl.set(isDisabled);
  }

  addById(id: number): void {
    if (this.isDisabled()) return;
    const min = this.minCount();
    const current = this.value();
    const existing = current.find((x) => x.id === id);
    let next: ChipCountItem[];
    if (existing) {
      next = current.map((x) =>
        x.id === id ? { ...x, count: x.count + 1 } : x
      );
    } else {
      next = [...current, { id, count: Math.max(1, min) }];
    }
    this.value.set(next);
    this.selectedOptionId.set(null);
    this.emitAndTouch(next);
  }

  increment(id: number): void {
    if (this.isDisabled()) return;
    const next = this.value().map((x) =>
      x.id === id ? { ...x, count: x.count + 1 } : x
    );
    this.value.set(next);
    this.emitAndTouch(next);
  }

  decrement(id: number): void {
    if (this.isDisabled()) return;
    const min = this.minCount();
    const current = this.value();
    const item = current.find((x) => x.id === id);
    if (!item) return;
    if (item.count <= min) {
      const next = current.filter((x) => x.id !== id);
      this.value.set(next);
      this.emitAndTouch(next);
    } else {
      const next = current.map((x) =>
        x.id === id ? { ...x, count: x.count - 1 } : x
      );
      this.value.set(next);
      this.emitAndTouch(next);
    }
  }

  removeChip(id: number): void {
    if (this.isDisabled()) return;
    const next = this.value().filter((x) => x.id !== id);
    this.value.set(next);
    this.emitAndTouch(next);
  }

  onSelectChange(event: Event): void {
    const el = event.target as HTMLSelectElement;
    const id = el.value ? Number(el.value) : null;
    if (id != null && !Number.isNaN(id)) {
      this.addById(id);
    }
    this.selectedOptionId.set(null);
    el.value = '';
  }

  private emitAndTouch(next: ChipCountItem[]): void {
    this.onChange(next);
    this.onTouched();
  }
}
