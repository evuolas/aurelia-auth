import {inject} from 'aurelia-dependency-injection';
import {BaseConfig}  from './baseConfig';
import {Storage} from './storage';
import authUtils from './authUtils';

@inject(Storage, BaseConfig)
export class Authentication {
  static __isAuthenticated = false;

  constructor(storage, config) {
    this.storage   = storage;
    this.config    = config.current;
  }

  get authMethod() {
    return this.config.authMethod;
  }

  get tokenName() {
    return this.config.tokenPrefix ? this.config.tokenPrefix + '_' + this.config.tokenName : this.config.tokenName;
  }

  get tokenNames() {
    return this.config.tokenNames;
  }

  getLoginRoute() {
    return this.config.loginRoute;
  }

  getLoginRedirect() {
    return this.config.loginRedirect;
  }

  getLoginUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.loginUrl) : this.config.loginUrl;
  }

  getSignupUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.signupUrl) : this.config.signupUrl;
  }

  getValidateTokenUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.validateTokenUrl) : this.config.validateTokenUrl;
  }

  getProfileUrl() {
    return this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.profileUrl) : this.config.profileUrl;
  }

  getToken() {
    return this.storage.get(this.tokenName);
  }

  getPayload() {
    let token = this.storage.get(this.tokenName);

    if (token && token.split('.').length === 3) {
      let base64Url = token.split('.')[1];
      let base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      try {
        return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
      } catch (error) {
        return null;
      }
    }
  }

  isTokenAuthEnabled() {
    return this.authMethod === 'token';
  }

  setTokenFromResponse(response, redirect) {
    let tokenName   = this.tokenName;
    let accessToken = response && response[this.config.responseTokenProp];
    let token;

    if (accessToken) {
      if (authUtils.isObject(accessToken) && authUtils.isObject(accessToken.data)) {
        response = accessToken;
      } else if (authUtils.isString(accessToken)) {
        token = accessToken;
      }
    }

    if (!token && response) {
      token = this.config.tokenRoot && response[this.config.tokenRoot] ? response[this.config.tokenRoot][this.config.tokenName] : response[this.config.tokenName];
    }

    if (!token) {
      let tokenPath = this.config.tokenRoot ? this.config.tokenRoot + '.' + this.config.tokenName : this.config.tokenName;

      throw new Error('Expecting a token named "' + tokenPath + '" but instead got: ' + JSON.stringify(response));
    }

    this.storage.set(tokenName, token);

    this.redirectAfterLogin(redirect);
  }

  setTokensFromHeaders(headers) {
    let tokenNames = this.tokenNames;

    if (authUtils.isArray(tokenNames)) {
      for (let i = 0; i < tokenNames.length; i++) {
        let key = tokenNames[i];
        let value = headers.get(key);

        if (value) {
          this.storage.set(key, value);
        }
      }
    } else {
      this.storage.set(this.tokenName, headers.get(tokenName));
    }
  }

  redirectAfterLogin(redirect) {
    if (this.config.loginRedirect && !redirect) {
      window.location.href = this.config.loginRedirect;
    } else if (redirect && authUtils.isString(redirect)) {
      window.location.href = window.encodeURI(redirect);
    }
  }

  redirectAfterLogout(redirect) {
    if (this.config.logoutRedirect && !redirect) {
      window.location.href = this.config.logoutRedirect;
    } else if (authUtils.isString(redirect)) {
      window.location.href = redirect;
    }
  }

  removeToken() {
    this.storage.remove(this.tokenName);
  }

  removeTokens() {
    this.tokenNames.forEach(tokenName => {
      this.storage.remove(tokenName);
    });
  }

  isAuthenticated() {
    if (this.isTokenAuthEnabled()) {
      let authenticated = true;
      authUtils.forEach(this.tokenNames, name => {
        let value = this.storage.get(name);
        authenticated = (authenticated && value && value !== 'null');
      });

      this.__isAuthenticated = authenticated;

      return authenticated;
    }

    let token = this.storage.get(this.tokenName);

    // There's no token, so user is not authenticated.
    if (!token) {
      this.__isAuthenticated = false;
      return false;
    }

    // There is a token, but in a different format. Return true.
    if (token.split('.').length !== 3) {
      this.__isAuthenticated = true;
      return true;
    }

    let base64Url = token.split('.')[1];
    let base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let exp;

    try {
      exp = JSON.parse(window.atob(base64)).exp;
    } catch (error) {
      return false;
    }

    if (exp) {
      return Math.round(new Date().getTime() / 1000) <= exp;
    }

    this.__isAuthenticated = true;
    return true;
  }

  logout(redirect) {
    return new Promise(resolve => {
      if (this.isTokenAuthEnabled()) {
        authUtils.forEach(this.tokenNames, name => {
          this.storage.remove(name);
        });
      } else {
        this.storage.remove(this.tokenName);
      }

      this.redirectAfterLogout();

      resolve();
    });
  }
}
