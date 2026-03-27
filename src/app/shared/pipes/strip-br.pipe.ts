import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stripBr',
  standalone: true
})
export class StripBrPipe implements PipeTransform {
  transform(
    value: string | null | undefined,
    replaceWith: string = ''
  ): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).replace(/<br\s*\/?>/gi, replaceWith);
  }
}
