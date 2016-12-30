import {inject} from 'aurelia-dependency-injection';
import {Authentication} from './authentication';
import {BaseConfig} from './baseConfig';
import {OAuth1} from './oAuth1';
import {OAuth2} from './oAuth2';
import authUtils from './authUtils';

@inject(Authentication, OAuth1, OAuth2, BaseConfig)
export class AuthService {
  static __tokenValidated = false;

  constructor(auth, oAuth1, oAuth2, config) {
    this.auth   = auth;
    this.oAuth1 = oAuth1;
    this.oAuth2 = oAuth2;
    this.config = config.current;
    this.client = this.config.client;
    this.data = {};
  }

  getMe(criteria) {
    if (typeof criteria === 'string' || typeof criteria === 'number') {
      criteria = {id: criteria};
    }
    return this.client.find(this.auth.getProfileUrl(), criteria);
  }

  updateMe(body, criteria) {
    if (typeof criteria === 'string' || typeof criteria === 'number') {
      criteria = {id: criteria};
    }
    return this.client.update(this.auth.getProfileUrl(), criteria, body);
  }

  isAuthenticated() {
    let authenticated = this.auth.isAuthenticated();

    if (authenticated && this.auth.isTokenAuthEnabled() && !this.__tokenValidated) {
      return this.validateToken();
    }

    return authenticated;
  }

  getTokenPayload() {
    return this.auth.getPayload();
  }

  signup(displayName, email, password) {
    let signupUrl = this.auth.getSignupUrl();
    let content;
    if (typeof arguments[0] === 'object') {
      content = arguments[0];
    } else {
      content = {
        'displayName': displayName,
        'email': email,
        'password': password
      };
    }
    return this.client.post(signupUrl, content)
      .then(response => {
        if (this.config.loginOnSignup) {
          this.auth.setTokenFromResponse(response);
        } else if (this.config.signupRedirect) {
          window.location.href = this.config.signupRedirect;
        }

        return response;
      });
  }

  login(email, password) {
    let loginUrl = this.auth.getLoginUrl();
    let content;
    if (typeof arguments[1] !== 'string') {
      content = arguments[0];
    } else {
      content = {
        'email': email,
        'password': password
      };
    }

    return this.client.post(loginUrl, content)
      .then(response => {
        if (!this.auth.isTokenAuthEnabled()) {
          this.auth.setTokenFromResponse(response);
        } else {
          this.__tokenValidated = true;
          this.auth.redirectAfterLogin();
        }
        return response;
      });
  }

  logout(redirectUri) {
    this.data = {};

    return this.auth.logout(redirectUri);
  }

  validateToken() {
    if (this.__tokenValidated) {
      return Promise.resolve(this.data);
    }

    let url = this.auth.getValidateTokenUrl();

    return this.client.find(url)
      .then(response => {
        this.auth.__isAuthenticated = true;
        this.__tokenValidated = true;

        const authenticated = this.auth.isAuthenticated();
        if (!authenticated) return Promise.reject();

        this.data = response.data;

        return response.data;
      })
      .catch(err => {
        this.auth.removeTokens();
        this.auth.__isAuthenticated = false;
        this.auth.redirectAfterLogout();
        this.data = {};

        return Promise.reject();
      });
  }

  authenticate(name, redirect, userData) {
    let provider = this.oAuth2;
    if (this.config.providers[name].type === '1.0') {
      provider = this.oAuth1;
    }

    return provider.open(this.config.providers[name], userData || {})
      .then(response => {
        this.auth.setTokenFromResponse(response, redirect);
        return response;
      });
  }

  unlink(provider) {
    let unlinkUrl = this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, this.config.unlinkUrl) : this.config.unlinkUrl;

    if (this.config.unlinkMethod === 'get') {
      return this.client.find(unlinkUrl + provider);
    } else if (this.config.unlinkMethod === 'post') {
      return this.client.post(unlinkUrl, provider);
    }
  }
}
