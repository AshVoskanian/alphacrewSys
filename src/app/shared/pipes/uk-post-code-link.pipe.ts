import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ukPostcodeLink',
  standalone: true
})
export class UkPostcodeLinkPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;

    const postcodeRegex = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})\b/gi;

    return value.replace(postcodeRegex, (match, part1, part2) => {
      const postcode = `${ part1 } ${ part2 }`;
      const url = `https://www.google.co.uk/maps/search/${ encodeURIComponent(postcode) }/`;
      return `<a href="${ url }" target="_blank">${ postcode }</a>`;
    });
  }
}
