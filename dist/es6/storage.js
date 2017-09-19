import { inject } from 'aurelia-dependency-injection';
import { Cookies } from 'aurelia-plugins-cookies';

import { BaseConfig } from './baseConfig';

@inject(BaseConfig)
export class Storage {
  constructor(config) {
    this.config = config.current;
  }

  get(key) {
    if (this.checkStorageAvailability()) {
      return this.getStorage().getItem(key);
    }

    return Cookies.get(key);
  }

  set(key, value) {
    if (this.checkStorageAvailability()) {
      return this.getStorage().setItem(key, value);
    }

    return Cookies.put(key, value);
  }

  remove(key) {
    if (this.checkStorageAvailability()) {
      return this.getStorage().removeItem(key);
    }

    return Cookies.remove(key);
  }

  checkStorageAvailability() {
    if (this.storageAvailabilityChecked) {
      return this.storageAvailable;
    }

    try {
      const storage = this.getStorage();
      const x = '__storage_test__';

      storage.setItem(x, x);
      storage.removeItem(x);

      this.storageAvailable = true;
    } catch (e) {
      this.storageAvailable = false;
    }

    this.storageAvailabilityChecked = true;

    return this.storageAvailable;
  }

  getStorage() {
    return window[this.config.storage];
  }
}
