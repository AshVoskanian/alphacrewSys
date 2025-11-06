import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'addPound'
})
export class AddPoundPipe implements PipeTransform {
  transform(value: string | number): string {
    if (value === null || value === undefined) return '';
    return `${value} £`;
  }
}
