import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  WritableSignal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Select2Module, Select2Option } from 'ng-select2-component';
import { ChipCountItem, ChipCountOption } from './chip-count-select.model';

@Component({
  selector: 'app-chip-count-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Select2Module],
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
  private readonly _fb = inject(FormBuilder);
  private readonly _dr = inject(DestroyRef);

  /** Full list of options (id + label) to choose from. */
  options = input.required<ChipCountOption[]>();

  /** Placeholder for the dropdown when no selection. */
  placeholder = input<string>('');

  /** Minimum count per chip (default 1). When decremented below, item is removed. */
  minCount = input<number>(1);

  /** Position: 'bottom' = chips above, select below (default); 'top' = select above, chips below. */
  position = input<'top' | 'bottom'>('top');

  /** Whether the control is disabled (from template). */
  disabled = input<boolean>(false);

  /** Disabled state set by form control (CVA). */
  private disabledByControl = signal<boolean>(false);

  /** Effective disabled: input or CVA. */
  isDisabled = computed(() => this.disabled() || this.disabledByControl());

  /** Current value: array of { id, count }. */
  value: WritableSignal<ChipCountItem[]> = signal<ChipCountItem[]>([]);

  /** Internal form for the Select2 "add" dropdown (not part of parent form). */
  select2Form = this._fb.group({ addOptionId: [null as number | null] });

  /** Options that are not yet in value (available in dropdown). */
  availableOptions = computed(() => {
    const opts = this.options();
    const selectedIds = new Set(this.value().map((v) => v.id));
    return opts.filter((o) => !selectedIds.has(o.id));
  });

  /** Select2 data: available options as { value, label }. */
  availableOptionsForSelect2 = computed<Select2Option[]>(() =>
    this.availableOptions().map((o) => ({ value: o.id, label: o.label }))
  );

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

  constructor() {
    this.select2Form
      .get('addOptionId')
      ?.valueChanges.pipe(takeUntilDestroyed(this._dr))
      .subscribe((v) => {
        if (v != null && typeof v === 'number') {
          this.addById(v);
          this.select2Form.patchValue({ addOptionId: null }, { emitEvent: false });
        }
      });

    effect(() => {
      const disabled = this.isDisabled();
      const ctrl = this.select2Form.get('addOptionId');
      if (disabled) ctrl?.disable({ emitEvent: false });
      else ctrl?.enable({ emitEvent: false });
    });
  }

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

  private emitAndTouch(next: ChipCountItem[]): void {
    this.onChange(next);
    this.onTouched();
  }
}
