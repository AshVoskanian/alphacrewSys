import { Component, input, output } from '@angular/core';
import { DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";

export interface CrewMainListItem<T = any> {
  title?: string;
  subtitle?: string;
  desc?: string;
  date?: string;
  dateDesc?: string;
  hasAction?: boolean;
  data?: T;
}

export interface CrewMainListActionData {
  listItem: CrewMainListItem,
  action: CrewMainListAction;
}

export type CrewMainListAction = 'remove' | 'edit';

@Component({
  selector: 'app-main-list',
  imports: [ DatePipe, FormsModule ],
  templateUrl: './main-list.component.html',
  styleUrl: './main-list.component.scss',
  providers: [ DatePipe ]
})
export class MainListComponent {
  list = input<CrewMainListItem[]>();

  clickAction = output<CrewMainListActionData>();

  onAction(action: CrewMainListAction, listItem: CrewMainListItem) {
    this.clickAction.emit({
      action,
      listItem
    });
  }
}
