import { Component, ElementRef, ViewChild } from '@angular/core';
import { HeaderLogoComponent } from "../header/widgets/header-logo/header-logo.component";
import { FeatherIconComponent } from "../ui/feather-icon/feather-icon.component";
import { items, menuItems } from '../../data/menu';
import { SvgIconComponent } from "../ui/svg-icon/svg-icon.component";
import { CommonModule } from '@angular/common';
import { Menu } from '../../interface/menu';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LayoutService } from '../../services/layout.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, HeaderLogoComponent,
            FeatherIconComponent, SvgIconComponent, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})

export class SidebarComponent {

  public menuItems = menuItems;
  public items = items;
  public leftArrow: boolean = false;
  public rightArrow: boolean = true;
  public pinedItem: Menu[] = [];

  constructor(private router: Router, public layoutService: LayoutService) {

    this.items.subscribe(menuItems => {
      this.menuItems = menuItems;
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          menuItems.filter(items => {
            if (items.path === event.url) {
              this.setNavActive(items);
            }
            if (!items.children) { return false; }
            items.children.filter(subItems => {
              if (subItems.path === event.url) {
                this.setNavActive(subItems);
              }
              if (!subItems.children) { return false; }
              subItems.children.filter(subSubItems => {
                if (subSubItems.path === event.url) {
                  this.setNavActive(subSubItems);
                }
              });
            });
          });
        }
      });
    });
  }

  setNavActive(items: Menu) {
    this.menuItems.filter(menuItem => {
      if (menuItem !== items) {
        menuItem.active = false;
      }
      if (menuItem.children && menuItem.children.includes(items)) {
        menuItem.active = true;
      }
      if (menuItem.children) {
        menuItem.children.filter(submenuItems => {
          if (submenuItems.children && submenuItems.children.includes(items)) {
            menuItem.active = true;
            submenuItems.active = true;
          }
        });
      }
    });
  }

  toggleMenu(item: Menu) {
    if (!item.active) {
      this.menuItems.forEach((menu) => {
        if (this.menuItems.includes(item)) {
          menu.active = false
        }
        if (!menu.children) {
          return false;
        }

        menu.children.forEach((subMenu) => {
          if (menu.children?.includes(item)) {
            subMenu.active = false
          }

          if (subMenu.children) {
            subMenu.children.forEach((details) => {
              if (subMenu.children?.includes(item)) {
                details.active = false;
              }
            })
          }
        })
      })
    }
    item.active = !item.active;
  }

  scrollLeft() {
    this.rightArrow = true;
    if (this.layoutService.margin != 0) {
      this.layoutService.margin = this.layoutService.margin + 500;
    }

    if (this.layoutService.margin == 0) {
      this.leftArrow = false;
    }
  }
  scrollRight() {
    this.leftArrow = true;
    if (this.layoutService.margin != -4500) {
      this.layoutService.margin = this.layoutService.margin - 500;
    }
    if (this.layoutService.margin == -4500) {
      this.rightArrow = false;
    }
  }

  closeSidebar() {
    this.layoutService.closeSidebar = true;
  }

  pined(item: Menu) {
    if (!item.pined) {
      this.menuItems.filter((details) => {
        if (details.title) {
          if (this.menuItems.includes(item)) {
            item.pined = true;
            if (!this.pinedItem.includes(item)) {
              this.pinedItem.push(item);
            }
          }
        }
      })
    } else {
      item.pined = false;
      this.pinedItem.splice(this.pinedItem.indexOf(item), 1)
    }

    this.scroll(item)
  }

  scroll(item: Menu) {
    if(item && item.title) {
      const scrollDiv = document.getElementById(item.title);

      if(scrollDiv) {
        setTimeout(() => {
          scrollDiv.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100);
      }
    }
  }

}
