import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import SwiperCore from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

SwiperCore.use([Navigation, Pagination, Autoplay]);

@Component({
  selector: 'app-header-notice',
  imports: [CommonModule],
  templateUrl: './header-notice.component.html',
  styleUrl: './header-notice.component.scss',
})
export class HeaderNoticeComponent {
  @ViewChild('swiperContainer', { static: false }) swiperContainer!: ElementRef;

  public notice = [
    `<img src="../assets/images/giftools.gif" alt="gif">
      <h6 class="mb-0 f-w-400"><span class="font-primary">Don't Miss Out! </span><span class="f-light">Our new update has been released.</span></h6><i class="icon-arrow-top-right f-light"></i>`,
    `<img src="../assets/images/giftools.gif" alt="gif">
      <h6 class="mb-0 f-w-400"><span class="f-light">Something you love is now on sale! </span></h6><a class="ms-1" href="https://1.envato.market/3GVzd" target="_blank">Buy now !</a>`,
  ];

  public swiperConfig: any = {
    slidesPerView: 1,
    navigation: false,
    direction: 'vertical',
    autoHeight: true,
    allowTouchMove: true,
    scrollbar: { draggable: true },
    pagination: { clickable: true },
    loop: true,
    autoplay: { delay: 2000 },
  };

  ngAfterViewInit() {
    if (this.swiperContainer) {
      new SwiperCore(this.swiperContainer.nativeElement, this.swiperConfig);
    }
  }
}
