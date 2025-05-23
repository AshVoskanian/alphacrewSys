import { Pipe, PipeTransform } from '@angular/core';

interface FilterCondition<T> {
  field: keyof T;
  condition: string;
  value?: any;
}

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {
  transform<T>(items: T[], filters: any): T[] {
    if (!items || !filters || filters.length === 0) return items;

    return items.filter(item => {
      return filters.every(filter => {
        const { field, condition, value } = filter;
        const itemValue = item[field];

        if (itemValue === null || itemValue === undefined) return false;
        const itemStrValue = itemValue.toString().toLowerCase();

        switch (condition) {
          case 'equals':
            return itemValue == value;
          case 'contains':
            return itemStrValue.includes(value.toString().toLowerCase());
          case 'greaterThan':
            return parseFloat(itemValue) > parseFloat(value);
          case 'greaterThanOrEqual':
            return parseFloat(itemValue) >= parseFloat(value);
          case 'lessThan':
            return parseFloat(itemValue) < parseFloat(value);
          case 'lessThanOrEqual':
            return parseFloat(itemValue) <= parseFloat(value);
          case 'startsWith':
            return itemStrValue.startsWith(value.toString().toLowerCase());
          case 'endsWith':
            return itemStrValue.endsWith(value.toString().toLowerCase());
          case 'isNotEmpty':
            return itemStrValue.trim().length > 0;
          default:
            return false;
        }
      });
    });
  }
}
