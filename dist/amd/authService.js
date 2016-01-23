define(['exports', 'aurelia-framework', './authentication', './baseConfig', './oAuth1', './oAuth2', './authUtils', 'aurelia-api'], function (exports, _aureliaFramework, _authentication, _baseConfig, _oAuth1, _oAuth2, _authUtils, _aureliaApi) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _authUtils2 = _interopRequireDefault(_authUtils);

  var AuthService = (function () {
    _createClass(AuthService, null, [{
      key: '__tokenValidated',
      value: false,
      enumerable: true
    }]);

    function AuthService(rest, auth, oAuth1, oAuth2, config) {
      _classCallCheck(this, _AuthService);

      this.rest = rest;
      this.auth = auth;
      this.oAuth1 = oAuth1;
      this.oAuth2 = oAuth2;
      this.config = config.current;
    }

    _createClass(AuthService, [{
      key: 'getMe',
      value: function getMe() {
        return this.rest.find(this.auth.getProfileUrl());
      }
    }, {
      key: 'updateMe',
      value: function updateMe(body) {
        var criteria = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        if (typeof criteria === 'string' || typeof criteria === 'number') {
          criteria = { id: criteria };
        }
        return this.rest.update(this.auth.getProfileUrl(), criteria, body);
      }
    }, {
      key: 'isAuthenticated',
      value: function isAuthenticated() {
        var autheticated = this.auth.isAuthenticated();

        if (authenticated && this.auth.isTokenAuthEnabled() && !this.__tokenValidated) {
          return this.validateToken();
        }

        return autheticated;
      }
    }, {
      key: 'getTokenPayload',
      value: function getTokenPayload() {
        return this.auth.getPayload();
      }
    }, {
      key: 'signup',
      value: function signup(displayName, email, password) {
        var _this = this;

        var signupUrl = this.auth.getSignupUrl();
        var content = undefined;
        if (typeof arguments[0] === 'object') {
          content = arguments[0];
        } else {
          content = {
            'displayName': displayName,
            'email': email,
            'password': password
          };
        }
        return this.rest.post(signupUrl, content).then(function (response) {
          if (_this.config.loginOnSignup) {
            _this.auth.setTokenFromResponse(response);
          } else if (_this.config.signupRedirect) {
            window.location.href = _this.config.signupRedirect;
          }

          return response;
        });
      }
    }, {
      key: 'login',
      value: function login(email, password) {
        var _this2 = this;

        var loginUrl = this.auth.getLoginUrl();
        var content = undefined;
        if (typeof arguments[1] !== 'string') {
          content = arguments[0];
        } else {
          content = {
            'email': email,
            'password': password
          };
        }

        return this.rest.post(loginUrl, content).then(function (response) {
          if (!_this2.auth.isTokenAuthEnabled()) {
            _this2.auth.setTokenFromResponse(response);
          } else {
            _this2.__tokenValidated = true;
            _this2.auth.redirectAfterLogin();
          }
          return response;
        });
      }
    }, {
      key: 'logout',
      value: function logout(redirectUri) {
        return this.auth.logout(redirectUri);
      }
    }, {
      key: 'validateToken',
      value: function validateToken() {
        var _this3 = this;

        var url = this.auth.getValidateTokenUrl();

        return this.rest.find(url).then(function (response) {
          console.log("AUTH ?=");
          _this3.auth.__isAuthenticated = true;
          _this3.__tokenValidated = true;
          return _this3.auth.isAuthenticated();
        })['catch'](function (err) {
          _this3.auth.removeTokens();
          _this3.auth.__isAuthenticated = false;
          _this3.auth.redirectAfterLogout();
        });
      }
    }, {
      key: 'authenticate',
      value: function authenticate(name, redirect, userData) {
        var _this4 = this;

        var provider = this.oAuth2;
        if (this.config.providers[name].type === '1.0') {
          provider = this.oAuth1;
        }

        return provider.open(this.config.providers[name], userData || {}).then(function (response) {
          _this4.auth.setTokenFromResponse(response, redirect);
          return response;
        });
      }
    }, {
      key: 'unlink',
      value: function unlink(provider) {
        var unlinkUrl = this.config.baseUrl ? _authUtils2['default'].joinUrl(this.config.baseUrl, this.config.unlinkUrl) : this.config.unlinkUrl;

        if (this.config.unlinkMethod === 'get') {
          return this.rest.find(unlinkUrl + provider);
        } else if (this.config.unlinkMethod === 'post') {
          return this.rest.post(unlinkUrl, provider);
        }
      }
    }]);

    var _AuthService = AuthService;
    AuthService = (0, _aureliaFramework.inject)(_aureliaApi.Rest, _authentication.Authentication, _oAuth1.OAuth1, _oAuth2.OAuth2, _baseConfig.BaseConfig)(AuthService) || AuthService;
    return AuthService;
  })();

  exports.AuthService = AuthService;
});