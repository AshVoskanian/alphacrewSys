import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NgbRatingConfig } from '@ng-bootstrap/ng-bootstrap';
import { LoaderComponent } from "./shared/components/ui/loader/loader.component";
import { LayoutService } from './shared/services/layout.service';
import { BackToTopComponent } from "./shared/components/ui/back-to-top/back-to-top.component";
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, BackToTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})

export class AppComponent {

  constructor(private config: NgbRatingConfig,
    public layoutService: LayoutService,
    private router: Router,
    private titleService: Title,
    private activatedRoute: ActivatedRoute) {
    this.config.max = 5;
    this.config.readonly = true;
  }

  ngOnInit() {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute.firstChild;
          while (route?.firstChild) {
            route = route.firstChild;
          }

          const pageTitle = route?.snapshot.data['pageTitle'] || route?.snapshot.data['title'];
          return pageTitle ? `Sys | ${pageTitle}` : 'Sys';
        })
      )
      .subscribe(title => {
        this.titleService.setTitle(title);
      });
  }

}
