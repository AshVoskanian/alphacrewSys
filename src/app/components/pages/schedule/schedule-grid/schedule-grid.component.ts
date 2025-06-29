import { Component, input, Input } from '@angular/core';
import { FeatherIconComponent } from "../../../../shared/components/ui/feather-icon/feather-icon.component";
import { CommonModule, DatePipe } from "@angular/common";
import { Schedule, StatusIcon } from "../../../../shared/interface/schedule";
import { NgbTooltip } from "@ng-bootstrap/ng-bootstrap";
import { CardComponent } from "../../../../shared/components/ui/card/card.component";
import { GridItemComponent } from "./grid-item/grid-item.component";

@Component({
  selector: 'app-schedule-grid',
  imports: [ CardComponent, CommonModule, DatePipe, NgbTooltip, GridItemComponent ],
  templateUrl: './schedule-grid.component.html',
  styleUrl: './schedule-grid.component.scss',
  standalone: true
})
export class ScheduleGridComponent {
  @Input() scheduleList: Array<Schedule> = [];
  @Input() loading: boolean = false;

  projects: any = [
    {
      id: 1,
      project_name: 'CRM Dashboard',
      project_description: 'Create a Brand logo design for a mofi admin.',
      project_banner: 'assets/images/project/list/1.png',
      date: '06 Nov, 2024',
      progress: 40,
      status: 'pending',
      budget: '$845,540.00',
      team_member: [
        { name: 'Alexis Taylor', profile: 'assets/images/dashboard/user/10.jpg' },
        { name: 'Andrew Price', profile: 'assets/images/dashboard/user/11.jpg' },
        { name: 'Emily Park' },
        { name: 'Caryl Kauth', profile: 'assets/images/dashboard/user/1.jpg' },
      ],
    },
    {
      id: 2,
      project_name: 'Chat Application',
      project_description:
        'Create a chat application for business messaging needs.',
      project_banner: 'assets/images/project/list/2.png',
      date: '10 Mar, 2024',
      progress: 100,
      status: 'completed',
      budget: '$348,940.00',
      team_member: [
        { name: 'Caleb Rivera', profile: 'assets/images/dashboard/user/12.jpg' },
        { name: 'Jenny Wilson', profile: 'assets/images/dashboard/user/2.jpg' },
        { name: 'Olivia Gor', profile: 'assets/images/dashboard/user/13.jpg' },
      ],
    },
    {
      id: 3,
      project_name: 'Redesign - Landing page',
      project_description:
        'Resign a landing page design. as per abc minimal design.',
      project_banner: 'assets/images/project/list/3.png',
      date: '12 July, 2023',
      progress: 60,
      status: 'in_progress',
      budget: '$753,759.00',
      team_member: [
        {
          name: 'Levine Raven',
          profile: 'assets/images/dashboard-11/user/2.jpg',
        },
        { name: 'Davis Jone', profile: 'assets/images/dashboard-11/user/12.jpg' },
        {
          name: 'Jessica Anderson',
          profile: 'assets/images/dashboard-9/user/2.png',
        },
        {
          name: 'Dashiell Wolfe',
          profile: 'assets/images/dashboard-9/user/5.png',
        },
      ],
    },
    {
      id: 4,
      project_name: 'Client Meeting',
      project_description: 'Meeting about share web all live link.',
      project_banner: 'assets/images/project/list/4.png',
      date: '10 Feb, 2023',
      progress: 20,
      status: 'pending',
      budget: '$159,948.00',
      team_member: [
        { name: 'Thomas Jones', profile: 'assets/images/dashboard-9/user/1.png' },
        { name: 'Karen Jones' },
        {
          name: 'Elizabeth Williams',
          profile: 'assets/images/dashboard-9/user/3.png',
        },
      ],
    },
    {
      id: 5,
      project_name: 'Makeover-Landing page',
      project_description: 'Create landing page in design guidelines.',
      project_banner: 'assets/images/project/list/5.png',
      date: '09 Feb, 2024',
      progress: 50,
      status: 'in_progress',
      budget: '$987,720.00',
      team_member: [
        {
          name: 'Sarah Wilson',
          profile: 'assets/images/dashboard-11/user/2.jpg',
        },
        {
          name: 'Richard Taylor',
          profile: 'assets/images/dashboard-11/user/1.jpg',
        },
        { name: 'Linda Brown' },
        {
          name: 'Jessica Anderson',
          profile: 'assets/images/dashboard-11/user/8.jpg',
        },
      ],
    },
    {
      id: 6,
      project_name: 'Sales Project',
      project_description:
        'Create a chat application for business messaging needs.',
      project_banner: 'assets/images/project/list/6.png',
      date: '14 May, 2024',
      progress: 70,
      status: 'pending',
      budget: '$821,961.00',
      team_member: [
        {
          name: 'Marley Ford',
          profile: 'assets/images/dashboard-11/user/10.jpg',
        },
        { name: 'Gray Curran', profile: 'assets/images/dashboard-11/user/9.jpg' },
        { name: 'Yarrow Wix' },
      ],
    },
    {
      id: 1,
      project_name: 'Grocery App',
      project_description:
        'smooth purchasing journey and effective delivery options.',
      project_banner: 'assets/images/project/list/7.png',
      date: '27 Oct, 2024',
      progress: 100,
      status: 'completed',
      budget: '$951,675.00',
      team_member: [
        { name: 'Calista Rivers', profile: 'assets/images/dashboard/user/3.jpg' },
        {
          name: 'Jasper Nightingale',
          profile: 'assets/images/dashboard/user/4.jpg',
        },
        { name: 'Seraphina Evergreen' },
        { name: 'Caspian Wilde', profile: 'assets/images/dashboard/user/5.jpg' },
      ],
    },
    {
      id: 2,
      project_name: 'NFT Website',
      project_description: 'Explore our NFT marketplace to find digital assets.',
      project_banner: 'assets/images/project/list/9.png',
      date: '02 Feb, 2024',
      progress: 75,
      status: 'in_progress',
      budget: '$753,759.00',
      team_member: [
        { name: 'Daxton Creed' },
        { name: 'Marigold Luna' },
        { name: 'Charles Rodriguez', profile: 'assets/images/user/14.png' },
        { name: 'Sarah Hernandez', profile: 'assets/images/user/3.png' },
      ],
    },
    {
      id: 3,
      project_name: 'Sales management',
      project_description:
        'Precise objectives and deliver exceptional performance.',
      project_banner: 'assets/images/project/list/10.png',
      date: '28 Jan, 2024',
      progress: 35,
      status: 'completed',
      budget: '$652,444.00',
      team_member: [
        { name: 'Atlas Stone', profile: 'assets/images/user/12.png' },
        { name: 'Oceana Meridian', profile: 'assets/images/user/10.jpg' },
        { name: 'Jett Maverick' },
      ],
    },
    {
      id: 4,
      project_name: 'Fish Mobile App',
      project_description: 'Real-time tracking, and fishing advice.',
      project_banner: 'assets/images/project/list/12.png',
      date: '28 Nov, 2024',
      progress: 87,
      status: 'in_progress',
      budget: '$241,989.00',
      team_member: [
        { name: 'Xander Wilde' },
        {
          name: 'Charles Rodriguez',
          profile: 'assets/images/dashboard-11/user/5.jpg',
        },
        { name: 'Zenith Nova' },
        {
          name: 'Sarah Hernandez',
          profile: 'assets/images/dashboard-11/user/6.jpg',
        },
      ],
    },
    {
      id: 5,
      project_name: 'Nursery App',
      project_description: "Correspondence and monitor your child's development.",
      project_banner: 'assets/images/project/list/11.png',
      date: '03 Sep, 2024',
      progress: 25,
      status: 'completed',
      budget: '$652,444.00',
      team_member: [
        { name: 'Kairos Frost' },
        { name: 'Oceana Meridian', profile: 'assets/images/user/2.jpg' },
        { name: 'Ember Wren' },
      ],
    },
    {
      id: 6,
      project_name: 'E-commerce Web',
      project_description: 'E-commerce is focusing on optimizing.',
      project_banner: 'assets/images/project/list/8.png',
      date: '08 Nov, 2024',
      progress: 80,
      status: 'pending',
      budget: '$400,548.00',
      team_member: [
        { name: 'Joseph Garcia', profile: 'assets/images/avatar/16.jpg' },
        { name: 'Elizabeth Davis', profile: 'assets/images/avatar/3.jpg' },
        { name: 'Karen Moore' },
        { name: 'Robert Williams' },
      ],
    },
  ];
}
