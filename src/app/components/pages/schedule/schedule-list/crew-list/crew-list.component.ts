import { Component, inject, input, Input } from '@angular/core';
import { NgbActiveOffcanvas } from "@ng-bootstrap/ng-bootstrap";
import { Crew, Schedule } from "../../../../../shared/interface/schedule";
import { SvgIconComponent } from "../../../../../shared/components/ui/svg-icon/svg-icon.component";

@Component({
  selector: 'app-crew-list',
  imports: [SvgIconComponent],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent {
  private _offcanvasService: NgbActiveOffcanvas = inject(NgbActiveOffcanvas);

  @Input() title: string;
  @Input() crewList: Array<Crew> = [];

  regions = [
    { id: 'region-checkbox-1', title: 'Lon', class: 'primary', checked: true },
    { id: 'region-checkbox-2', title: 'Birm', class: 'primary', checked: false },
    { id: 'region-checkbox-3', title: 'Manch', class: 'primary', checked: false },
    { id: 'region-checkbox-4', title: 'Brist', class: 'primary', checked: false },
    { id: 'region-checkbox-5', title: 'Scot', class: 'primary', checked: true },
    { id: 'region-checkbox-6', title: 'Nice', class: 'primary', checked: false },
    { id: 'region-checkbox-7', title: 'Par', class: 'primary', checked: false },
    { id: 'region-checkbox-8', title: 'Brc', class: 'primary', checked: false },
  ];

  levels = [
    { id: 'level-checkbox-1', title: 'PBC', class: 'warning', checked: true },
    { id: 'level-checkbox-2', title: 'L1', class: 'warning', checked: false },
    { id: 'level-checkbox-3', title: 'L2', class: 'warning', checked: false },
    { id: 'level-checkbox-4', title: 'L3', class: 'warning', checked: false },
    { id: 'level-checkbox-5', title: 'L4', class: 'warning', checked: true },
    { id: 'level-checkbox-6', title: 'CC2', class: 'warning', checked: false },
    { id: 'level-checkbox-7', title: 'CC1', class: 'warning', checked: false },
    { id: 'level-checkbox-8', title: 'SCC', class: 'warning', checked: false },
    { id: 'level-checkbox-9', title: 'S', class: 'warning', checked: false },
    { id: 'level-checkbox-10', title: 'SS', class: 'warning', checked: false },
    { id: 'level-checkbox-11', title: 'ES', class: 'warning', checked: false },
  ];


  closeOffcanvas() {
    this._offcanvasService.close()
  }
}
