import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})

export class LayoutService {

  public closeSidebar: boolean = true;
  public loading: boolean = false;

  public margin: number = 0;
  public config  = {
    settings: {
      layout_type: 'ltr',
      layout_version: 'light-only',
      sidebar_type: 'horizontal-wrapper',
      icon: "stroke-svg",
      layout: 'singapore'
    },
    color: {
      primary: '#7366ff',
      secondary: '#838383',
    },
  };

  applyLayout(layout: string) {
    if(layout == 'dubai') {
      this.config.settings.sidebar_type = 'compact-wrapper';
    } else if(layout == 'los-angle') {
      this.config.settings.sidebar_type = 'horizontal-wrapper material-type';
    } else if(layout == 'paris') {
      this.config.settings.sidebar_type = 'compact-wrapper dark-sidebar';
    } else if(layout == 'tokyo') {
      this.config.settings.sidebar_type = 'compact-sidebar';
    } else if(layout == 'moscow') {
      this.config.settings.sidebar_type = 'compact-sidebar compact-small';
    } else if(layout == 'singapore') {
      this.config.settings.sidebar_type = 'horizontal-wrapper enterprice-type';
    } else if(layout == 'newyork') {
      this.config.settings.sidebar_type = 'compact-wrapper box-layout';
    } else if(layout == 'barcelona') {
      this.config.settings.sidebar_type = 'horizontal-wrapper enterprice-type advance-layout';
    } else if(layout == 'madrid') {
      this.config.settings.sidebar_type = 'compact-wrapper color-sidebar';
    } else if(layout == 'rome') {
      this.config.settings.sidebar_type = 'compact-sidebar compact-small material-icon';
    } else if(layout == 'seoul') {
      this.config.settings.sidebar_type = 'compact-wrapper modern-type';
    } else if(layout == 'london') {
      this.config.settings.sidebar_type = 'only-body';
    }
  }
}
