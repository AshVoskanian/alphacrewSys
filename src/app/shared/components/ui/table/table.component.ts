import { CommonModule, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NgbCalendar,
  NgbDateParserFormatter,
  NgbDatepickerModule,
  NgbModal,
  NgbPaginationModule,
  NgbTooltipModule
} from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';

import { SvgIconComponent } from "../svg-icon/svg-icon.component";
import { TableClickedAction, TableConfigs, TableRows } from '../../../interface/common';
import { TableService } from "../../../services/table.service";
import { NgxPaginationModule } from "ngx-pagination";

@Component({
  selector: 'app-table',
  imports: [ CommonModule, NgbPaginationModule, FormsModule,
    RouterModule, NgbDatepickerModule, NgbTooltipModule,
    NgxPaginationModule, SvgIconComponent ],
  providers: [ DecimalPipe ],
  templateUrl: './table.component.html',
  styleUrls: [ './table.component.scss' ]
})
export class TableComponent implements OnInit {

  @Input() tableConfig: TableConfigs;
  @Input() hasCheckbox: boolean;
  @Input() pageNo: number = 1
  @Input() pageSize: number = 4;
  @Input() maxHeight: number = 1000;
  @Input() totalCount: number = 100;
  @Input() paginateDetails: boolean = false;
  @Input() showPaginate: boolean = false;
  @Input() tableClass: string;
  @Input() search: boolean = true;
  @Input() pagination: boolean = true;
  @Input() selectedRows: boolean = false;
  @Input() rowDetails: boolean = false;
  @Input() dateFilter: boolean = false;
  @Input() hover: boolean = false;
  @Input() downloadReports: boolean = false;
  @Input() searchPlaceholder: string = '';

  @Output() action = new EventEmitter<TableClickedAction>();
  @Output() rowClicked = new EventEmitter<any>();

  public selected: number[] = [];
  public tableData: any;

  public sortable_key: string;
  public selectedOpenRows: number[] = [];

  public filter = {
    search: '',
    sort: 'asc',
    page: this.pageNo,
    pageSize: this.pageSize
  }

  constructor(public tableService: TableService, private modal: NgbModal, private calendar: NgbCalendar,
              public formatter: NgbDateParserFormatter) {
  }

  ngOnInit() {
    this.applyFilters();
  }

  checkUncheckAll(event: Event) {
    this.tableConfig.data.forEach((item: any) => {
      item.is_checked = (<HTMLInputElement> event?.target)?.checked;
      this.setSelectedItem((<HTMLInputElement> event?.target)?.checked, item?.id);
    });
  }

  onItemChecked(event: Event) {
    this.setSelectedItem((<HTMLInputElement> event.target)?.checked, Number((<HTMLInputElement> event.target)?.value));
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

  applyFilters() {
    let filteredData = [ ...this.tableConfig.data ];

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
    this.tableData = filteredData
  }

  handleAction(value: TableRows, details: any) {
    if (value.action_to_perform == 'delete') {
      if (!value.modal) {
        this.action.emit({ action_to_perform: value.action_to_perform, data: details })
      } else {
        Swal.fire({
          title: 'Are you sure?',
          text: value.model_text ? value.model_text : 'Do you really want to delete the file?',
          imageUrl: './assets/images/gif/trash.gif',
          confirmButtonText: 'Yes, delete it!',
          showCancelButton: true,
          cancelButtonText: 'Cancel',
          cancelButtonColor: '#FC4438'
        }).then((result) => {
          if (result.isConfirmed) {
            this.action.emit({ action_to_perform: value.action_to_perform, data: details })
          }
        })
      }
    }
    if (value.action_to_perform == 'view') {
      this.action.emit({ action_to_perform: value.action_to_perform, data: details })
    }

    if (value.action_to_perform == 'edit') {
      this.action.emit({ action_to_perform: value.action_to_perform, data: details })
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
}
