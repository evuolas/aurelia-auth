import {HttpClient} from 'aurelia-fetch-client';
import {Authentication} from './authentication';
import {AuthService} from './authService';
import {BaseConfig} from './baseConfig';
import {inject} from 'aurelia-framework';
import {Storage} from './storage';
import authUtils from './authUtils';

@inject(HttpClient, Authentication, AuthService, Storage, BaseConfig)
export class FetchConfig {
  constructor(httpClient, authentication, authService, storage, config) {
    this.httpClient  = httpClient;
    this.auth        = authentication;
    this.authService = authService;
    this.storage     = storage;
    this.config      = config.current;
  }

  configure() {
    let auth        = this.auth;
    let authService = this.authService;
    let config      = this.config;
    let storage     = this.storage;
    let baseUrl     = this.httpClient.baseUrl;

    this.httpClient.configure(httpConfig => {
      httpConfig
        .withBaseUrl(baseUrl)
        .withInterceptor({
          request(request) {
            if (auth.isAuthenticated() && config.httpInterceptor) {
              if (auth.isTokenAuthEnabled()) {
                authUtils.forEach(config.tokenNames, tokenName => {
                  let value = storage.get(tokenName);
                  request.headers.append(tokenName, value);
                });
              } else {
                let tokenName = config.tokenPrefix ? `${config.tokenPrefix}_${config.tokenName}` : config.tokenName;
                let token     = storage.get(tokenName);

                if (config.authHeader && config.authToken) {
                  token = `${config.authToken} ${token}`;
                }

                request.headers.append(config.authHeader, token);
              }
            }

            return request;
          }
        })
        .withInterceptor({
          response(response) {
            if (auth.isTokenAuthEnabled()) {
              auth.setTokensFromHeaders(response.headers);
            }

            return response;
          },
          responseError(response) {
            if (auth.isTokenAuthEnabled() && auth.isAuthenticated() && response.status === 401) {
              authService.validateToken();
            }

            return response;
          }
        });

    });
  }
}
