define(['exports', 'aurelia-fetch-client', './authentication', './authService', './baseConfig', 'aurelia-framework', './storage', './authUtils'], function (exports, _aureliaFetchClient, _authentication, _authService, _baseConfig, _aureliaFramework, _storage, _authUtils) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _authUtils2 = _interopRequireDefault(_authUtils);

  var FetchConfig = (function () {
    function FetchConfig(httpClient, authentication, authService, storage, config) {
      _classCallCheck(this, _FetchConfig);

      this.httpClient = httpClient;
      this.auth = authentication;
      this.authService = authService;
      this.storage = storage;
      this.config = config.current;
    }

    _createClass(FetchConfig, [{
      key: 'configure',
      value: function configure() {
        var auth = this.auth;
        var authService = this.authService;
        var config = this.config;
        var storage = this.storage;
        var baseUrl = this.httpClient.baseUrl;

        this.httpClient.configure(function (httpConfig) {
          httpConfig.withBaseUrl(baseUrl).withInterceptor({
            request: function request(_request) {
              if (auth.isAuthenticated() && config.httpInterceptor) {
                if (auth.isTokenAuthEnabled()) {
                  _authUtils2['default'].forEach(config.tokenNames, function (tokenName) {
                    var value = storage.get(tokenName);
                    _request.headers.append(tokenName, value);
                  });
                } else {
                  var tokenName = config.tokenPrefix ? config.tokenPrefix + '_' + config.tokenName : config.tokenName;
                  var token = storage.get(tokenName);

                  if (config.authHeader && config.authToken) {
                    token = config.authToken + ' ' + token;
                  }

                  _request.headers.append(config.authHeader, token);
                }
              }

              return _request;
            }
          }).withInterceptor({
            response: function response(_response) {
              if (auth.isTokenAuthEnabled()) {
                auth.setTokensFromHeaders(_response.headers);
              }

              return _response;
            },
            responseError: function responseError(response) {
              if (auth.isTokenAuthEnabled() && auth.isAuthenticated() && response.status === 401) {
                authService.validateToken();
              }

              return response;
            }
          });
        });
      }
    }]);

    var _FetchConfig = FetchConfig;
    FetchConfig = (0, _aureliaFramework.inject)(_aureliaFetchClient.HttpClient, _authentication.Authentication, _authService.AuthService, _storage.Storage, _baseConfig.BaseConfig)(FetchConfig) || FetchConfig;
    return FetchConfig;
  })();

  exports.FetchConfig = FetchConfig;
});