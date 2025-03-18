import { Component, Input } from '@angular/core';

import { CardComponent } from "../../../../../../shared/components/ui/card/card.component";
import { FeatherIconComponent } from "../../../../../../shared/components/ui/feather-icon/feather-icon.component";
import { SvgIconComponent } from "../../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { Details } from '../../../../../../shared/interface/dashboard/default';

@Component({
  selector: 'app-details',
  imports: [CardComponent, SvgIconComponent, FeatherIconComponent],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})

export class DetailsComponent {

  @Input() detail: Details;

}
