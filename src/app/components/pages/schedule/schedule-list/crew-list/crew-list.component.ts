import { Component, inject, Input, OnInit } from '@angular/core';
import { NgbActiveOffcanvas, NgbPopoverModule } from "@ng-bootstrap/ng-bootstrap";
import { Crew } from "../../../../../shared/interface/schedule";
import { SvgIconComponent } from "../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { CardComponent } from "../../../../../shared/components/ui/card/card.component";
import { CrewFilterPipe } from "../../../../../shared/pipes/crew-filter.pipe";
import { FormGroup, FormsModule } from "@angular/forms";

@Component({
  selector: 'app-crew-list',
  imports: [
    SvgIconComponent, CardComponent, CrewFilterPipe,
    FormsModule, NgbPopoverModule
  ],
  providers: [ CrewFilterPipe ],
  templateUrl: './crew-list.component.html',
  styleUrl: './crew-list.component.scss'
})
export class CrewListComponent implements OnInit {
  private _filterPipe: CrewFilterPipe = inject(CrewFilterPipe);
  private _offcanvasService: NgbActiveOffcanvas = inject(NgbActiveOffcanvas);

  @Input() title: string;
  @Input() crewList: Array<Crew> = [];

  form: FormGroup;

  allAreSelected: boolean = false;

  regions = [
    { id: 1, title: 'Lon', class: 'primary', checked: true },
    { id: 2, title: 'Birm', class: 'primary', checked: false },
    { id: 5, title: 'Manch', class: 'primary', checked: false },
    { id: 6, title: 'Brist', class: 'primary', checked: false },
    { id: 7, title: 'Scot', class: 'primary', checked: false },
    { id: 3, title: 'Nice', class: 'primary', checked: false },
    { id: 4, title: 'Par', class: 'primary', checked: false },
    { id: 8, title: 'Brc', class: 'primary', checked: false },
  ];

  levels = [
    { id: 5, title: 'PBC', class: 'warning', checked: true },
    { id: 1, title: 'L1', class: 'warning', checked: false },
    { id: 2, title: 'L2', class: 'warning', checked: false },
    { id: 3, title: 'L3', class: 'warning', checked: false },
    { id: 4, title: 'L4', class: 'warning', checked: false },
    { id: 1, title: 'CC2', class: 'warning', checked: false },
    { id: 24, title: 'CC1', class: 'warning', checked: false },
    { id: 15, title: 'SCC', class: 'warning', checked: false },
    { id: 18, title: 'S', class: 'warning', checked: false },
    { id: 20, title: 'SS', class: 'warning', checked: false },
    { id: 21, title: 'ES', class: 'warning', checked: false },
  ];

  ngOnInit() {
  }

  closeOffcanvas() {
    this._offcanvasService.close()
  }

  getSelectedData(type: 'regions' | 'levels'): Array<number> {
    if (type === 'regions') {
      return this.regions.filter(it => it.checked).map(it => it.id);
    }

    if (type === 'levels') {
      return this.levels.filter(it => it.checked).map(it => it.id);
    }

    return [];
  }

  selectAll() {
    this.crewList.forEach(it => it.isChecked = this.allAreSelected);
  }

  areAllChecked(crew: Array<Crew>): boolean {
    return !crew.some(it => !it.isChecked);
  }

  crewSelect(crew: Crew) {
    crew.isChecked = !crew.isChecked;

    const transformedCrew = this._filterPipe.transform(
      this.crewList,
      this.getSelectedData('regions'),
      this.getSelectedData('levels')
    )
    this.allAreSelected = this.areAllChecked(transformedCrew);
  }
}
