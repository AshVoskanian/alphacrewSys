import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

import { CardToggleOptions } from '../../../../interface/common';

@Component({
  selector: 'app-card-dropdown-button',
  imports: [CommonModule, NgbDropdownModule],
  templateUrl: './card-dropdown-button.component.html',
  styleUrl: './card-dropdown-button.component.scss'
})

export class CardDropdownButtonComponent {

  @Input() dropdownType: string;
  @Input() options: CardToggleOptions[];
  @Input() dropdownClass: string;

  public show: boolean = false;
  public selectedItem: string;

  ngOnChanges() {
    this.selectedItem = this.options[0]?.title;
  }

  selectItem(value: string) {
    this.selectedItem = value;
    this.show = false;
  }
  
}
