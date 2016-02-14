import {inject} from 'aurelia-dependency-injection';
import authUtils from './authUtils';
import {Storage} from './storage';
import {Popup} from './popup';
import {BaseConfig} from './baseConfig';

@inject(Storage, Popup, BaseConfig)
export class OAuth2 {
  constructor(storage, popup, config) {
    this.storage      = storage;
    this.config       = config.current;
    this.client       = this.config.client;
    this.popup        = popup;
    this.defaults     = {
      url: null,
      name: null,
      state: null,
      scope: null,
      scopeDelimiter: null,
      redirectUri: null,
      popupOptions: null,
      authorizationEndpoint: null,
      responseParams: null,
      requiredUrlParams: null,
      optionalUrlParams: null,
      defaultUrlParams: ['response_type', 'client_id', 'redirect_uri'],
      responseType: 'code'
    };
  }

  open(options, userData) {
    let current = authUtils.extend({}, this.defaults, options);
    let stateName = current.name + '_state';

    if (authUtils.isFunction(current.state)) {
      this.storage.set(stateName, current.state());
    } else if (authUtils.isString(current.state)) {
      this.storage.set(stateName, current.state);
    }

    let url = current.authorizationEndpoint + '?' + this.buildQueryString(current);

    let openPopup;
    if (this.config.platform === 'mobile') {
      openPopup = this.popup.open(url, current.name, current.popupOptions, current.redirectUri).eventListener(current.redirectUri);
    } else {
      openPopup = this.popup.open(url, current.name, current.popupOptions, current.redirectUri).pollPopup();
    }

    return openPopup
      .then(oauthData => {
        if (current.responseType === 'token' ||
          current.responseType === 'id_token%20token' ||
          current.responseType === 'token%20id_token'
        ) {
          return oauthData;
        }
        if (oauthData.state && oauthData.state !== this.storage.get(stateName)) {
          return Promise.reject('OAuth 2.0 state parameter mismatch.');
        }
        return this.exchangeForToken(oauthData, userData, current);
      });
  }

  exchangeForToken(oauthData, userData, current) {
    let data = authUtils.extend({}, userData, {
      code: oauthData.code,
      clientId: current.clientId,
      redirectUri: current.redirectUri
    });

    if (oauthData.state) {
      data.state = oauthData.state;
    }

    authUtils.forEach(current.responseParams, param => data[param] = oauthData[param]);

    let exchangeForTokenUrl = this.config.baseUrl ? authUtils.joinUrl(this.config.baseUrl, current.url) : current.url;
    let credentials         = this.config.withCredentials ? 'include' : 'same-origin';

    return this.client.post(exchangeForTokenUrl, data, {credentials: credentials});
  }

  buildQueryString(current) {
    let keyValuePairs = [];
    let urlParams     = ['defaultUrlParams', 'requiredUrlParams', 'optionalUrlParams'];

    authUtils.forEach(urlParams, params => {
      authUtils.forEach(current[params], paramName => {
        let camelizedName = authUtils.camelCase(paramName);
        let paramValue    = authUtils.isFunction(current[paramName]) ? current[paramName]() : current[camelizedName];

        if (paramName === 'state') {
          let stateName = current.name + '_state';
          paramValue    = encodeURIComponent(this.storage.get(stateName));
        }

        if (paramName === 'scope' && Array.isArray(paramValue)) {
          paramValue = paramValue.join(current.scopeDelimiter);

          if (current.scopePrefix) {
            paramValue = [current.scopePrefix, paramValue].join(current.scopeDelimiter);
          }
        }

        keyValuePairs.push([paramName, paramValue]);
      });
    });

    return keyValuePairs.map(pair => pair.join('=')).join('&');
  }

}
