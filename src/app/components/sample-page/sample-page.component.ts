import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SamplePage2Component } from "../pages/dashboard/sample-page2/sample-page2.component";

@Component({
  selector: 'app-sample-page',
  standalone: true,
  imports: [ CommonModule, SamplePage2Component ],
  templateUrl: './sample-page.component.html',
  styleUrl: './sample-page.component.scss'
})
export class SamplePageComponent {

}
