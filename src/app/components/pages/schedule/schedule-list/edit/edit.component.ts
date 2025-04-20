import { Component } from '@angular/core';
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Select2Data, Select2Module } from "ng-select2-component";

@Component({
  selector: 'app-edit',
  imports: [ Select2Module ],
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.scss',
  providers: [ NgbActiveModal ]
})
export class EditComponent {
  selectState: Select2Data = [
    {
      label: 'U.K',
      value: 'U.K'
    },
    {
      label: 'India',
      value: 'India'
    },
    {
      label: 'Thailand',
      value: 'Thailand'
    },
    {
      label: 'Newyork',
      value: 'Newyork'
    },
  ]

  filledCheckbox = [
    {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234567'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '1234567890'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678907'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '12345678907'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076r'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076re'
    }, {
      class: 'solid-warning',
      text: 'Driver',
      value: true,
      id: '123456789076rew'
    }

  ]

  constructor(private modal: NgbActiveModal) {
  }

  closeModal() {
    this.modal.close();
  }
}
