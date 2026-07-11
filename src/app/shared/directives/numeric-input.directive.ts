import {
  Directive,
  ElementRef,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[numericInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumericInputDirective),
      multi: true
    }
  ]
})
export class NumericInputDirective implements ControlValueAccessor, OnChanges {

  @Input('numericInputDecimals') decimals?: number;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};
  private lastNumericValue: number | null = null;
  private isEditingZero = false;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['decimals'] && this.lastNumericValue === 0 && !this.isEditingZero) {
      this.el.nativeElement.value = this.formatZero();
    }
  }

  writeValue(value: number | string | null | undefined): void {
    if (this.isEditingZero) {
      return;
    }

    const numericValue = this.toNumber(value);
    this.lastNumericValue = numericValue;
    this.el.nativeElement.value = this.formatDisplayValue(numericValue, value);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.lastNumericValue === 0) {
      this.isEditingZero = true;
      this.el.nativeElement.value = '';
      return;
    }

    setTimeout(() => this.el.nativeElement.select());
  }

  @HostListener('input')
  onInput(): void {
    this.processValue(this.el.nativeElement.value, false);
  }

  @HostListener('blur')
  onBlur(): void {
    this.isEditingZero = false;
    this.onTouched();
    this.processValue(this.el.nativeElement.value, true);
  }

  private processValue(raw: string, onBlur: boolean): void {
    if (this.isEmpty(raw)) {
      if (!onBlur) {
        this.lastNumericValue = 0;
        this.onChange(0);
        return;
      }

      this.applyZero();
      return;
    }

    const normalized = this.stripLeadingZeros(raw);
    const numericValue = Number(normalized);

    if (!Number.isNaN(numericValue) && numericValue === 0) {
      if (onBlur) {
        this.applyZero();
        return;
      }

      this.applyValue(normalized, 0);
      return;
    }

    if (Number.isNaN(numericValue)) {
      this.applyValue(normalized, 0);
      return;
    }

    this.applyValue(normalized, numericValue, onBlur);
  }

  private isEmpty(value: string): boolean {
    return value.trim() === '';
  }

  private stripLeadingZeros(value: string): string {
    const dotIndex = value.indexOf('.');

    if (dotIndex === -1) {
      if (value.length <= 1) {
        return value;
      }

      return value.replace(/^0+/, '') || '0';
    }

    const integerPart = value.slice(0, dotIndex);
    const decimalPart = value.slice(dotIndex + 1);
    const normalizedInteger = integerPart.length > 1
      ? integerPart.replace(/^0+/, '') || '0'
      : integerPart;

    return `${normalizedInteger}.${decimalPart}`;
  }

  private formatDisplayValue(numericValue: number, rawValue: number | string | null | undefined): string {
    if (this.decimals != null) {
      return numericValue.toFixed(this.decimals);
    }

    if (numericValue === 0) {
      return this.formatZero();
    }

    return rawValue == null || rawValue === '' ? this.formatZero() : String(rawValue);
  }

  private formatZero(): string {
    if (this.decimals == null) {
      return '0';
    }

    return (0).toFixed(this.decimals);
  }

  private applyZero(): void {
    this.lastNumericValue = 0;
    this.el.nativeElement.value = this.formatZero();
    this.onChange(0);
  }

  private applyValue(displayValue: string, numericValue: number, onBlur = false): void {
    this.lastNumericValue = numericValue;
    this.el.nativeElement.value = onBlur && this.decimals != null
      ? numericValue.toFixed(this.decimals)
      : displayValue;
    this.onChange(numericValue);
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value == null || value === '') {
      return 0;
    }

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? 0 : numericValue;
  }
}
