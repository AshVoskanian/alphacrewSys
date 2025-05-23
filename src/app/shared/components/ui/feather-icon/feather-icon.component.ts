import { Component, Input, signal } from '@angular/core';
import feather from 'feather-icons';

@Component({
  selector: 'app-feather-icon',
  imports: [],
  templateUrl: './feather-icon.component.html',
  standalone: true,
  styleUrl: './feather-icon.component.scss'
})

export class FeatherIconComponent {

  @Input('icon') public icon: string | undefined;
  @Input() class: string;
  constructor(  ) {}

  ngAfterViewInit() {
    feather.replace();
  }

}
