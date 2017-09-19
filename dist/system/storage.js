System.register(['aurelia-dependency-injection', 'aurelia-plugins-cookies', './baseConfig'], function (_export) {
  'use strict';

  var inject, Cookies, BaseConfig, Storage;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_aureliaDependencyInjection) {
      inject = _aureliaDependencyInjection.inject;
    }, function (_aureliaPluginsCookies) {
      Cookies = _aureliaPluginsCookies.Cookies;
    }, function (_baseConfig) {
      BaseConfig = _baseConfig.BaseConfig;
    }],
    execute: function () {
      Storage = (function () {
        function Storage(config) {
          _classCallCheck(this, _Storage);

          this.config = config.current;
        }

        _createClass(Storage, [{
          key: 'get',
          value: function get(key) {
            if (this.checkStorageAvailability()) {
              return this.getStorage().getItem(key);
            }

            return Cookies.get(key);
          }
        }, {
          key: 'set',
          value: function set(key, value) {
            if (this.checkStorageAvailability()) {
              return this.getStorage().setItem(key, value);
            }

            return Cookies.put(key, value);
          }
        }, {
          key: 'remove',
          value: function remove(key) {
            if (this.checkStorageAvailability()) {
              return this.getStorage().removeItem(key);
            }

            return Cookies.remove(key);
          }
        }, {
          key: 'checkStorageAvailability',
          value: function checkStorageAvailability() {
            if (this.storageAvailabilityChecked) {
              return this.storageAvailable;
            }

            try {
              var storage = this.getStorage();
              var x = '__storage_test__';

              storage.setItem(x, x);
              storage.removeItem(x);

              this.storageAvailable = true;
            } catch (e) {
              this.storageAvailable = false;
            }

            this.storageAvailabilityChecked = true;

            return this.storageAvailable;
          }
        }, {
          key: 'getStorage',
          value: function getStorage() {
            return window[this.config.storage];
          }
        }]);

        var _Storage = Storage;
        Storage = inject(BaseConfig)(Storage) || Storage;
        return Storage;
      })();

      _export('Storage', Storage);
    }
  };
});