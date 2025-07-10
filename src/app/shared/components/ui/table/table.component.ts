import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbCalendar, NgbDate, NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbPaginationModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import Swal from 'sweetalert2';

import { SvgIconComponent } from "../svg-icon/svg-icon.component";
import { PageSizeOptions, Pagination, TableClickedAction, TableConfigs, TableRows } from '../../../interface/common';
import { TableService } from "../../../services/table.service";
import { PaginationComponent } from "../pagination/pagination.component";

@Component({
  selector: 'app-table',
  imports: [CommonModule, NgbPaginationModule, FormsModule,
            RouterModule, NgbDatepickerModule, NgbTooltipModule,
            PaginationComponent, SvgIconComponent],
  providers: [DecimalPipe],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {

  @Input() tableConfig: TableConfigs;
  @Input() hasCheckbox: boolean;
  @Input() pageSize: number = 4;
  @Input() paginateDetails: boolean = false;
  @Input() showPaginate: boolean = false;
  @Input() tableClass: string;
  @Input() search: boolean = true;
  @Input() pagination: boolean = true;
  @Input() selectedRows: boolean = false;
  @Input() rowDetails: boolean = false;
  @Input() dateFilter: boolean = false;
  @Input() downloadReports: boolean = false;
  @Input() searchPlaceholder: string = '';

  @Output() action = new EventEmitter<TableClickedAction>();

  public tableData$: Observable<any>;
  public total$: Observable<number>;
  public selected: number[] = [];
  public paginate: Pagination; // Pagination use only
  public tableData: any;
  public pageNo: number = 1
  public sortValue: string = 'asc';
  public sortable_key: string;
  public searchText: string = '';
  public rowDetailOpen: boolean = false;
  public selectedOpenRows: number[] = [];
  public dateDropdownOpen: boolean = false;
  public hoveredDate: NgbDate | null = null;
	public fromDate: NgbDate | null;
	public toDate: NgbDate | null;

  public filter = {
    search: '',
    sort: 'asc',
    page: this.pageNo,
    pageSize: this.pageSize,
    date: {
      start_date: '',
      to_date: ''
    }
  }

  public pageSizeOptions: PageSizeOptions[] = [
    { title: 10, value: 10 },
    { title: 15, value: 15 },
    { title: 25, value: 25 },
    { title: 50, value: 50 },
    { title: 100, value: 100 }
  ]

  constructor(public tableService: TableService, private modal: NgbModal, private calendar: NgbCalendar,
    public formatter: NgbDateParserFormatter) {
    }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['pageSize']) {
      this.filter['pageSize'] = changes['pageSize'].currentValue;

      if (!this.pageSizeOptions.some(option => option.value === this.filter['pageSize'])) {
        const index = this.pageSizeOptions.findIndex(option => option.value > this.filter['pageSize']);

        const newOption = { title: this.filter['pageSize'], value: this.filter['pageSize'] , selected: true };

        if (index === -1) {
          this.pageSizeOptions.push(newOption);
        } else {
          this.pageSizeOptions.splice(index, 0, newOption);
        }
      }
    }

    if (changes['tableConfig'] && this.tableConfig && this.tableConfig.data) {
      this.paginateData();
    }

    if (changes['pageNo']) {
      this.paginateData();
    }
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  getNestedPropertyValue(dataField: string | undefined, columnData: any): string {
    if (!dataField) {
      return '';
    }

    let keys = dataField.split('.');
    let value = columnData;

    for (let key of keys) {
      if (value && value.hasOwnProperty(key)) {
        value = value[key];
      } else {
        return '';
      }
    }

    return value;
  }

  getColumnClass(template: string, details: any) {
    for(let key in details) {
      if(template.includes(key)) {
        const value = details[key];
          template = template.replace(key, value);
      }
    }
    return template
  }

  checkUncheckAll(event: Event) {
    this.tableConfig.data.forEach((item: any) => {
      item.is_checked = (<HTMLInputElement>event?.target)?.checked;
      this.setSelectedItem((<HTMLInputElement>event?.target)?.checked, item?.id);
    });
  }

  onItemChecked(event: Event) {
    this.setSelectedItem((<HTMLInputElement>event.target)?.checked, Number((<HTMLInputElement>event.target)?.value));
  }

  setSelectedItem(checked: Boolean, value: Number) {
    const index = this.selected.indexOf(Number(value));
    if (checked) {
      if (index == -1) this.selected.push(Number(value));
    } else {
      this.selected = this.selected.filter(id => id !== Number(value));
    }
  }

  onSort(field: string) {
    this.sortable_key = field;
    this.filter['page'] = 1;
    this.filter['sort'] == 'asc' ? this.filter['sort'] = 'desc' : this.filter['sort'] = 'asc';
    this.applyFilters();
  }

  paginateData() {
    if (this.tableConfig && this.tableConfig.data) {
      this.applyFilters();
    }
  }

  setPage(data: number) {
    this.filter['page'] = data;
    this.paginateData();
  }

  searchTerm(value: string) {
    this.filter['page'] = 1;
    this.filter['search'] = value;
    this.applyFilters();
  }

  handleSelect(event: any) {
    this.filter['pageSize'] = +event.target.value;
    this.applyFilters();
  }

  handleAction(value: TableRows, details: any) {
    if(value.action_to_perform == 'delete') {
      if(!value.modal) {
        this.action.emit({action_to_perform: value.action_to_perform, data: details})
      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: value.model_text ? value.model_text : 'Do you really want to delete the product?',
          imageUrl: 'assets/images/gif/trash.gif',
          confirmButtonText: 'Yes, delete it!',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          cancelButtonColor: '#FC4438'
        }).then((result) => {
          if(result.isConfirmed) {
            this.action.emit({action_to_perform: value.action_to_perform, data: details})
          }
        })
      }
    }
    if(value.action_to_perform == 'view') {
      this.action.emit({action_to_perform: value.action_to_perform, data: details})
    }
  }

  openRowDetails(id: number) {
    const index = this.selectedOpenRows.indexOf(id);

    if (index === -1) {
      this.selectedOpenRows.push(id);
    } else {
      this.selectedOpenRows = this.selectedOpenRows.filter(rowId => rowId !== id);
    }
  }

  getColSpan() {
    const columnLength = this.tableConfig.columns.length;
    const actionLength = this.tableConfig.row_action ? 1 : 0;
    const isCheckbox = this.hasCheckbox ? 1 : 0;
    const isRowDetails = this.rowDetails ? 1 : 0;

    return columnLength + actionLength + isCheckbox + isRowDetails;
  }

  public selectedDate: string = '';
  public selectedValue: string = '';

  handleDropdown() {
    this.dateDropdownOpen =! this.dateDropdownOpen;
  }

  handleDateFilter(value: string) {
    this.selectedValue = value;
    let today = new Date();
    let formattedDate = today.getFullYear() + '-'
               + String(today.getMonth() + 1).padStart(2, '0') + '-'
               + String(today.getDate()).padStart(2, '0');

    if(this.selectedValue) {
      if (this.selectedValue === 'today') {
        this.filter['date']['start_date'] = formattedDate;
        this.filter['date']['to_date'] = formattedDate;
      } else if (this.selectedValue === 'yesterday') {
        let yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        formattedDate = yesterday.getFullYear() + '-'
                      + String(yesterday.getMonth() + 1).padStart(2, '0') + '-'
                      + String(yesterday.getDate()).padStart(2, '0');
        this.filter['date']['start_date'] = formattedDate;
        this.filter['date']['to_date'] = formattedDate;
      } else if (this.selectedValue === '7_days') {
        let sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        formattedDate = sevenDaysAgo.getFullYear() + '-'
                      + String(sevenDaysAgo.getMonth() + 1).padStart(2, '0') + '-'
                      + String(sevenDaysAgo.getDate()).padStart(2, '0');
        this.filter['date']['start_date'] = formattedDate;
        this.filter['date']['to_date'] = today.getFullYear() + '-'
                                          + String(today.getMonth() + 1).padStart(2, '0') + '-'
                                          + String(today.getDate()).padStart(2, '0');
      } else if (this.selectedValue === '30_days') {
        let thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        formattedDate = thirtyDaysAgo.getFullYear() + '-'
                      + String(thirtyDaysAgo.getMonth() + 1).padStart(2, '0') + '-'
                      + String(thirtyDaysAgo.getDate()).padStart(2, '0');
        this.filter['date']['start_date'] = formattedDate;
        this.filter['date']['to_date'] = today.getFullYear() + '-'
                                          + String(today.getMonth() + 1).padStart(2, '0') + '-'
                                          + String(today.getDate()).padStart(2, '0');
      } else if (this.selectedValue === 'this_month') {
        let startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        let endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of the month

        let formattedStartDate = startOfMonth.getFullYear() + '-'
                                + String(startOfMonth.getMonth() + 1).padStart(2, '0') + '-'
                                + String(startOfMonth.getDate()).padStart(2, '0');

        let formattedEndDate = endOfMonth.getFullYear() + '-'
                              + String(endOfMonth.getMonth() + 1).padStart(2, '0') + '-'
                              + String(endOfMonth.getDate()).padStart(2, '0');

        this.filter['date']['start_date'] = formattedStartDate;
        this.filter['date']['to_date'] = formattedEndDate; // Last day of the month
      }
       else if (this.selectedValue === 'last_month') {
        let firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        let lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        formattedDate = firstDayLastMonth.getFullYear() + '-'
                      + String(firstDayLastMonth.getMonth() + 1).padStart(2, '0') + '-'
                      + String(firstDayLastMonth.getDate()).padStart(2, '0');
        this.filter['date']['start_date'] = formattedDate;
        formattedDate = lastDayLastMonth.getFullYear() + '-'
                      + String(lastDayLastMonth.getMonth() + 1).padStart(2, '0') + '-'
                      + String(lastDayLastMonth.getDate()).padStart(2, '0');
        this.filter['date']['to_date'] = formattedDate;
      }
    }

    this.selectedDate = `${this.filter['date']['start_date']} - ${this.filter['date']['to_date']}`
    this.dateDropdownOpen = false;
    this.applyFilters();

  }

  onDateSelection(date: NgbDate) {
    if (!this.fromDate || (this.fromDate && this.toDate)) {
      this.fromDate = date;
      this.toDate = null;
    } else if (this.fromDate && !this.toDate) {
      if (date.after(this.fromDate)) {
        this.toDate = date;
        this.filter['date']['start_date'] = `${this.fromDate.year}-${String(this.fromDate.month).padStart(2, '0')}-${String(this.fromDate.day).padStart(2, '0')}`;
        this.filter['date']['to_date'] = `${this.toDate.year}-${String(this.toDate.month).padStart(2, '0')}-${String(this.toDate.day).padStart(2, '0')}`;
        this.selectedDate = `${this.filter['date']['start_date']} - ${this.filter['date']['to_date']}`;
      } else {
        this.fromDate = date;
      }
    }

    if(this.fromDate && this.toDate) {
      this.selectedValue = '';
    }

    this.applyFilters();

  }

	isHovered(date: NgbDate) {
		return (
			this.fromDate && !this.toDate && this.hoveredDate && date.after(this.fromDate) && date.before(this.hoveredDate)
		);
	}

	isInside(date: NgbDate) {
		return this.toDate && date.after(this.fromDate) && date.before(this.toDate);
	}

	isRange(date: NgbDate) {
		return (
			date.equals(this.fromDate) ||
			(this.toDate && date.equals(this.toDate)) ||
			this.isInside(date) ||
			this.isHovered(date)
		);
	}

	validateInput(currentValue: NgbDate | null, input: string): NgbDate | null {
		const parsed = this.formatter.parse(input);
		return parsed && this.calendar.isValid(NgbDate.from(parsed)) ? NgbDate.from(parsed) : currentValue;
	}

  applyFilters() {
    let filteredData = [...this.tableConfig.data];

    // Search filter
    if (this.filter['search'].trim() !== '') {
      filteredData = filteredData.filter((item: any) => {
        return Object.keys(item).some(key => {
          const value = item[key];
          if (typeof value === 'string' || typeof value === 'object') {
            const valueString = typeof value === 'string' ? value : value.toString();

            if (valueString.toLowerCase().includes(this.filter['search'].toLowerCase())) {
              return true;
            }
          }
          if (typeof value === 'number' && value.toString().includes(this.filter['search'])) {
            return true;
          }

          return false;
        });
      });
    }

    // Sorting filter
    if (this.filter['sort']) {
      filteredData.sort((a: any, b: any): number => {
        const valueA = a[this.sortable_key];
        const valueB = b[this.sortable_key];
        const getTextContent = (value: any): string => {
          if (typeof value === 'string') {
            return value;
          }
          if (typeof value === 'object') {
            const div = document.createElement('div');
            div.innerHTML = value.toString();
            return div.textContent || div.innerText || '';
          }
          return '';
        };
        const textA = getTextContent(valueA);
        const textB = getTextContent(valueB);
        if ((typeof valueA === 'string' || typeof valueA === 'object') &&
            (typeof valueB === 'string' || typeof valueB === 'object')) {
          return this.filter['sort'] === 'asc'
            ? textA.localeCompare(textB)
            : textB.localeCompare(textA);
        }
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return this.filter['sort'] === 'asc'
            ? valueA - valueB
            : valueB - valueA;
        }

        return 0;
      });
    }

    // Date range filter
    if (this.filter['date']['start_date']) {

      filteredData = filteredData.filter((data: any) => {
        if (data && data.date) {
          const recordDate = new Date(data.date);
          const fromDate = new Date(this.filter['date']['start_date']);
          const toDate = this.filter['date']['to_date'] ? new Date(this.filter['date']['to_date']) : null;

          if (fromDate && toDate) {
            return recordDate >= fromDate && recordDate <= toDate;
          } else if (fromDate) {
            return recordDate >= fromDate;
          } else if (toDate) {
            return recordDate <= toDate;
          }
        }
        return true;
      });
    }

    // Pagination
    this.paginate = this.tableService.getPager(filteredData.length, this.filter['page'], this.filter['pageSize']);
    this.tableData = filteredData.slice(this.paginate.start_index, this.paginate.end_index + 1);
  }
}
