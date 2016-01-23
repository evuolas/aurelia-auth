define(['exports', 'aurelia-framework', './baseConfig', './storage', './authUtils'], function (exports, _aureliaFramework, _baseConfig, _storage, _authUtils) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _authUtils2 = _interopRequireDefault(_authUtils);

  var Authentication = (function () {
    _createClass(Authentication, null, [{
      key: '__isAuthenticated',
      value: false,
      enumerable: true
    }]);

    function Authentication(storage, config) {
      _classCallCheck(this, _Authentication);

      this.storage = storage;
      this.config = config.current;
      this.authMethod = this.config.authMethod;
      this.tokenName = this.config.tokenPrefix ? this.config.tokenPrefix + '_' + this.config.tokenName : this.config.tokenName;
      this.tokenNames = this.config.tokenNames;
    }

    _createClass(Authentication, [{
      key: 'getLoginRoute',
      value: function getLoginRoute() {
        return this.config.loginRoute;
      }
    }, {
      key: 'getLoginRedirect',
      value: function getLoginRedirect() {
        return this.config.loginRedirect;
      }
    }, {
      key: 'getLoginUrl',
      value: function getLoginUrl() {
        return this.config.baseUrl ? _authUtils2['default'].joinUrl(this.config.baseUrl, this.config.loginUrl) : this.config.loginUrl;
      }
    }, {
      key: 'getSignupUrl',
      value: function getSignupUrl() {
        return this.config.baseUrl ? _authUtils2['default'].joinUrl(this.config.baseUrl, this.config.signupUrl) : this.config.signupUrl;
      }
    }, {
      key: 'getValidateTokenUrl',
      value: function getValidateTokenUrl() {
        return this.config.baseUrl ? _authUtils2['default'].joinUrl(this.config.baseUrl, this.config.validateTokenUrl) : this.config.validateTokenUrl;
      }
    }, {
      key: 'getProfileUrl',
      value: function getProfileUrl() {
        return this.config.baseUrl ? _authUtils2['default'].joinUrl(this.config.baseUrl, this.config.profileUrl) : this.config.profileUrl;
      }
    }, {
      key: 'getToken',
      value: function getToken() {
        return this.storage.get(this.tokenName);
      }
    }, {
      key: 'getPayload',
      value: function getPayload() {
        var token = this.storage.get(this.tokenName);

        if (token && token.split('.').length === 3) {
          var base64Url = token.split('.')[1];
          var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
        }
      }
    }, {
      key: 'isTokenAuthEnabled',
      value: function isTokenAuthEnabled() {
        return this.authMethod === 'token';
      }
    }, {
      key: 'setTokenFromResponse',
      value: function setTokenFromResponse(response, redirect) {
        var tokenName = this.tokenName;
        var accessToken = response && response[this.config.responseTokenProp];
        var token = undefined;

        if (accessToken) {
          if (_authUtils2['default'].isObject(accessToken) && _authUtils2['default'].isObject(accessToken.data)) {
            response = accessToken;
          } else if (_authUtils2['default'].isString(accessToken)) {
            token = accessToken;
          }
        }

        if (!token && response) {
          token = this.config.tokenRoot && response[this.config.tokenRoot] ? response[this.config.tokenRoot][this.config.tokenName] : response[this.config.tokenName];
        }

        if (!token) {
          var tokenPath = this.config.tokenRoot ? this.config.tokenRoot + '.' + this.config.tokenName : this.config.tokenName;

          throw new Error('Expecting a token named "' + tokenPath + '" but instead got: ' + JSON.stringify(response));
        }

        this.storage.set(tokenName, token);

        this.redirectAfterLogin(redirect);
      }
    }, {
      key: 'setTokensFromHeaders',
      value: function setTokensFromHeaders(headers) {
        var tokenNames = this.tokenNames;

        if (_authUtils2['default'].isArray(tokenNames)) {
          for (var i = 0; i < tokenNames.length; i++) {
            var key = tokenNames[i];
            var value = headers.get(key);

            if (value) {
              this.storage.set(key, value);
            }
          }
        } else {
          this.storage.set(this.tokenName, headers.get(tokenName));
        }
      }
    }, {
      key: 'redirectAfterLogin',
      value: function redirectAfterLogin(redirect) {
        if (this.config.loginRedirect && !redirect) {
          window.location.href = this.config.loginRedirect;
        } else if (redirect && _authUtils2['default'].isString(redirect)) {
          window.location.href = window.encodeURI(redirect);
        }
      }
    }, {
      key: 'redirectAfterLogout',
      value: function redirectAfterLogout(redirect) {
        if (this.config.logoutRedirect && !redirect) {
          window.location.href = this.config.logoutRedirect;
        } else if (_authUtils2['default'].isString(redirect)) {
          window.location.href = redirect;
        }
      }
    }, {
      key: 'removeToken',
      value: function removeToken() {
        this.storage.remove(this.tokenName);
      }
    }, {
      key: 'removeTokens',
      value: function removeTokens() {
        var _this = this;

        this.tokenNames.forEach(function (tokenName) {
          _this.storage.remove(tokenName);
        });
      }
    }, {
      key: 'isAuthenticated',
      value: function isAuthenticated() {
        var _this2 = this;

        if (this.isTokenAuthEnabled()) {
          var authenticated = true;

          _authUtils2['default'].forEach(this.tokenNames, function (name) {
            var value = _this2.storage.get(name);
            authenticated = authenticated && value && value !== 'null';
          });

          this.__isAuthenticated = authenticated;
          return authenticated;
        }

        var token = this.storage.get(this.tokenName);

        if (!token) {
          this.__isAuthenticated = false;
          return false;
        }

        if (token.split('.').length !== 3) {
          this.__isAuthenticated = true;
          return true;
        }

        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var exp = JSON.parse(window.atob(base64)).exp;

        if (exp) {
          return Math.round(new Date().getTime() / 1000) <= exp;
        }

        this.__isAuthenticated = true;
        return true;
      }
    }, {
      key: 'logout',
      value: function logout(redirect) {
        var _this3 = this;

        return new Promise(function (resolve) {
          if (_this3.isTokenAuthEnabled()) {
            _authUtils2['default'].forEach(_this3.tokenNames, function (name) {
              _this3.storage.remove(name);
            });
          } else {
            _this3.storage.remove(_this3.tokenName);
          }

          _this3.redirectAfterLogout();

          resolve();
        });
      }
    }]);

    var _Authentication = Authentication;
    Authentication = (0, _aureliaFramework.inject)(_storage.Storage, _baseConfig.BaseConfig)(Authentication) || Authentication;
    return Authentication;
  })();

  exports.Authentication = Authentication;
});