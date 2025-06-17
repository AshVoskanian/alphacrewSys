import { Component, Input } from '@angular/core';
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { CommonModule, DatePipe } from "@angular/common";
import { Schedule, StatusIcon } from "../../../../shared/interface/schedule";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-schedule-grid',
  imports: [ FeatherIconComponent, CommonModule, DatePipe, NgbTooltip ],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  standalone: true
})
export class ScheduleGridComponent {
  @Input() list: Array<Schedule> = [];


  STATUS_ICON_MAP: Record<string, StatusIcon> = {
    Draft: { icon: 'fas fa-pen-to-square', color: '#ffffff' },
    Quote: { icon: 'fas fa-comment-dollar', color: '#808080' },
    Confirmed: { icon: 'fas fa-check-circle', color: '#98fb98' },
    Cancelled: { icon: 'fas fa-times-circle', color: '#ffa07a' },
    TurnedDown: { icon: 'fas fa-ban', color: '#ff0000' },
    Completed: { icon: 'fas fa-circle-check', color: '#add8e6' },
    Invoiced: { icon: 'fas fa-file-invoice-dollar', color: '#538c2b' },
    Paid: { icon: 'fas fa-money-bill-wave', color: '#5d9634' },
    'Part - Paid': { icon: 'fas fa-credit-card', color: '#5d9634' },
    'In-Dispute': { icon: 'fas fa-balance-scale', color: '#a9a9a9' },
    'Write-off': { icon: 'fas fa-trash-alt', color: '#a9a9a9' },
    'Legacy Job': { icon: 'fas fa-scroll', color: '#d3d3d3' },
    'Pro-Forma': { icon: 'fas fa-file-alt', color: '#808080' },
  };

  statuses = [
    {
      id: 1,
      title: 'Draft',
      value: 'draft',
      icon: 'pen-to-square',
    },
    {
      id: 2,
      title: 'Quote',
      value: 'quote',
      icon: 'comment-dollar',
    },
    {
      id: 3,
      title: 'Confirmed',
      value: 'confirmed',
      icon: 'check-circle',
    },
    {
      id: 4,
      title: 'Cancelled',
      value: 'cancelled',
      icon: 'times-circle',
    },
    {
      id: 5,
      title: 'Turned Down',
      value: 'turned_down',
      icon: 'ban',
    },
    {
      id: 6,
      title: 'Completed',
      value: 'completed',
      icon: 'circle-check',
    },
    {
      id: 7,
      title: 'Invoiced',
      value: 'invoiced',
      icon: 'file-invoice-dollar',
    },
    {
      id: 8,
      title: 'Paid',
      value: 'paid',
      icon: 'money-bill-wave',
    },
    {
      id: 9,
      title: 'Part - Paid',
      value: 'part_paid',
      icon: 'credit-card',
    },
    {
      id: 10,
      title: 'In-Dispute',
      value: 'in_dispute',
      icon: 'balance-scale',
    },
    {
      id: 11,
      title: 'Write-off',
      value: 'write_off',
      icon: 'trash-alt',
    },
    {
      id: 12,
      title: 'Legacy Job',
      value: 'legacy_job',
      icon: 'scroll',
    },
    {
      id: 13,
      title: 'Pro-Forma',
      value: 'pro_forma',
      icon: 'file-alt',
    },
  ];

  getStatusIcon(status: string) {
    return this.STATUS_ICON_MAP[status]?.icon || 'fas fa-question';
  }

  getStatusColor(status: string) {
    return this.STATUS_ICON_MAP[status]?.color || '#000000';
  }

  handleTab(tab: any) {

  }
}
