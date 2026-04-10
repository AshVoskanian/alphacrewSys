import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {

  private loaded = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  async loadPlaces(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.loaded) {
      return;
    }

    setOptions({
      key: 'AIzaSyAh2RrJ3jfW7sBKmB4QNIiZwEAudY_-FqI',
      language: 'en',
      region: 'gb'
    });

    await importLibrary('places');
    this.loaded = true;
  }
}
