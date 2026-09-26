import { Pipe, PipeTransform } from '@angular/core';

/** Short labels for known regions (keys are lowercase) */
export const REGION_SHORT_MAP: Record<string, string> = {
  london: 'Lon',
  birmingham: 'Birm',
  manchester: 'Manch',
  nice: 'Nice',
  bristol: 'Brist',
  scotland: 'Scot',
  paris: 'Par',
  barcelona: 'Bcn',
  'new york': 'NY',
  berlin: 'Berl',
};

@Pipe({
  name: 'shortRegion',
  standalone: true,
})
export class ShortRegionPipe implements PipeTransform {
  /**
   * @param value full region name
   * @param length how many letters to keep for unknown regions (2 or 3, default 3)
   */
  transform(value: string | null | undefined, length: 2 | 3 = 3): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    const key = trimmed.toLowerCase();

    // 1. Known region
    const known = REGION_SHORT_MAP[key];
    if (known) {
      return known;
    }

    // 2. Multiple words -> initials ("San Francisco" -> "SF")
    const words = trimmed.split(/[\s-]+/).filter(Boolean);
    if (words.length > 1) {
      return words
        .map((w) => w[0].toUpperCase())
        .join('')
        .slice(0, length);
    }

    // 3. Fallback: first 2-3 letters
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1, length).toLowerCase();
  }
}
