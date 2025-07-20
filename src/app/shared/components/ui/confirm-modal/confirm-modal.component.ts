import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'app-confirm-modal',
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  @Input() title: string;
  @Input() subTitle: string;

  @Output() closeModal: EventEmitter<'ok' | 'cancel'> = new EventEmitter<'ok' | 'cancel'>();
}
