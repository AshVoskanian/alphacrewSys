import { Component, inject, Input } from '@angular/core';
import { CommonModule, NgClass, TitleCasePipe } from "@angular/common";
import { ChatService } from "../../../../../shared/services/chat.service";
import { SvgIconComponent } from "../../../../../shared/components/ui/svg-icon/svg-icon.component";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { Schedule, StatusIcon } from "../../../../../shared/interface/schedule";
import { FeatherIconComponent } from "../../../../../shared/components/ui/feather-icon/feather-icon.component";
import { GeneralService } from "../../../../../shared/services/general.service";

@Component({
  selector: 'app-grid-item',
  imports: [
    CommonModule, NgbTooltipModule, SvgIconComponent,
    TitleCasePipe, FeatherIconComponent , NgClass
  ],
  templateUrl: './grid-item.component.html',
  styleUrl: './grid-item.component.scss'
})
export class GridItemComponent {
  public chatService: ChatService = inject(ChatService);

  @Input() schedule: Schedule;

  STATUS_ICON_MAP: Record<string, StatusIcon> = {
    Draft: { icon: 'fas fa-pen-to-square', color: '#ffffff' },
    Quote: { icon: 'fas fa-comment-dollar', color: '#808080' },
    Confirmed: { icon: 'fas fa-check-circle', color: '#98fb98' },
    Cancelled: { icon: 'fas fa-times-circle', color: '#ffa07a' },
    TurnedDown: { icon: 'fas fa-ban', color: '#ff0000' },
    Completed: { icon: 'fas fa-circle-check', color: '#add8e6' },
    Invoiced: { icon: 'fas fa-file-invoice-dollar', color: '#538c2b' },
    Paid: { icon: 'fas fa-money-bill-wave', color: '#5d9634' },
    'In-Dispute': { icon: 'fas fa-balance-scale', color: '#a9a9a9' },
    'Write-off': { icon: 'fas fa-trash-alt', color: '#a9a9a9' },
    'Legacy Job': { icon: 'fas fa-scroll', color: '#d3d3d3' },
    'Pro-Forma': { icon: 'fas fa-file-alt', color: '#808080' },
  };


  getStatusIcon(status: string) {
    return this.STATUS_ICON_MAP[status]?.icon || 'fas fa-question';
  }

  getStatusColor(status: string) {
    return this.STATUS_ICON_MAP[status]?.color || '#000000';
  }

  getStatusTextColor(status: string): string {
    const bgColor = this.getStatusColor(status);

    // remove "#" and convert to RGB
    const r = parseInt(bgColor.substr(1, 2), 16);
    const g = parseInt(bgColor.substr(3, 2), 16);
    const b = parseInt(bgColor.substr(5, 2), 16);

    // Calculate relative luminance (sRGB)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black text for bright backgrounds, white for dark
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  getRole(jobPartCrewRoleId: number) {
    switch (jobPartCrewRoleId) {
      case 1: return ', Crew';
      case 2: return ', Crew Chief';
      case 3: return ', Team Leader';
      default: return '';
    }
  }

  hoursDifference(startDateIso: string, endDateIso: string) {
    return GeneralService.calculateHoursDifference(startDateIso, endDateIso);
  }

  getMissingPeopleCount() {
    return this.schedule.crews.filter(it => !it.isActive).length;
  }
}
