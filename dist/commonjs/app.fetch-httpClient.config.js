'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _aureliaFetchClient = require('aurelia-fetch-client');

var _authentication = require('./authentication');

var _baseConfig = require('./baseConfig');

var _aureliaDependencyInjection = require('aurelia-dependency-injection');

var _storage = require('./storage');

var _authUtils = require('./authUtils');

var _authUtils2 = _interopRequireDefault(_authUtils);

var _spoonxAureliaApi = require('spoonx/aurelia-api');

var FetchConfig = (function () {
  function FetchConfig(httpClient, clientConfig, authService, storage, config) {
    _classCallCheck(this, _FetchConfig);

    this.httpClient = httpClient;
    this.clientConfig = clientConfig;
    this.auth = authService;
    this.storage = storage;
    this.config = config.current;
  }

  _createClass(FetchConfig, [{
    key: 'configure',
    value: function configure(client) {
      var _this = this;

      if (Array.isArray(client)) {
        var _ret = (function () {
          var configuredClients = [];
          client.forEach(function (toConfigure) {
            configuredClients.push(_this.configure(toConfigure));
          });

          return {
            v: configuredClients
          };
        })();

        if (typeof _ret === 'object') return _ret.v;
      }

      if (typeof client === 'string') {
        client = this.clientConfig.getEndpoint(client).client;
      } else if (client instanceof _spoonxAureliaApi.Rest) {
        client = client.client;
      } else if (!(client instanceof _aureliaFetchClient.HttpClient)) {
        client = this.httpClient;
      }

      client.configure(function (httpConfig) {
        httpConfig.withBaseUrl(client.baseUrl).withInterceptor(_this.interceptor);

        if (_this.auth.isTokenAuthEnabled()) {
          httpConfig.withBaseUrl(client.baseUrl).withInterceptor(_this.tokenAuthInterceptor);
        }
      });

      return client;
    }
  }, {
    key: 'interceptor',
    get: function get() {
      var auth = this.auth;
      var config = this.config;
      var storage = this.storage;

      return {
        request: function request(_request) {
          if (!auth.isAuthenticated() || !config.httpInterceptor) {
            return _request;
          }

          if (auth.isTokenAuthEnabled()) {
            _authUtils2['default'].forEach(config.tokenNames, function (tokenName) {
              var value = storage.get(tokenName);
              _request.headers.append(tokenName, value);
            });

            var accessToken = storage.get('access-token');
            var tokenType = storage.get('token-type');

            if (config.authHeader && accessToken && tokenType) {
              _request.headers.append(config.authHeader, tokenType + ' ' + accessToken);
            }
          } else {
            var tokenName = config.tokenPrefix ? config.tokenPrefix + '_' + config.tokenName : config.tokenName;
            var token = storage.get(tokenName);

            if (config.authHeader && config.authToken) {
              token = config.authToken + ' ' + token;
            }

            _request.headers.append(config.authHeader, token);
          }

          return _request;
        }
      };
    }
  }, {
    key: 'tokenAuthInterceptor',
    get: function get() {
      var auth = this.auth;

      return {
        response: function response(_response) {
          auth.setTokensFromHeaders(_response.headers);

          return _response;
        },
        responseError: function responseError(response) {
          if (auth.isAuthenticated() && response.status === 401) {
            auth.validateToken();
          }

          return response;
        }
      };
    }
  }]);

  var _FetchConfig = FetchConfig;
  FetchConfig = (0, _aureliaDependencyInjection.inject)(_aureliaFetchClient.HttpClient, _spoonxAureliaApi.Config, _authentication.Authentication, _storage.Storage, _baseConfig.BaseConfig)(FetchConfig) || FetchConfig;
  return FetchConfig;
})();

exports.FetchConfig = FetchConfig;