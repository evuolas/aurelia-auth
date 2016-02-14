# Aurelia-auth

[![Build Status](https://travis-ci.org/SpoonX/aurelia-auth.svg)](https://travis-ci.org/SpoonX/aurelia-auth)
[![Join the chat at https://gitter.im/SpoonX/Dev](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/SpoonX/Dev?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Makes setting up authentication for your Aurelia app simple.

## What is aurelia-auth?
This is a largely refactored module based on [paul van bladel's aurelia-auth](https://github.com/paulvanbladel/aurelia-auth/).

aurelia-auth is a token-based authentication plugin for [Aurelia](http://aurelia.io/) with support for popular social authentication providers (Google, Twitter, Facebook, LinkedIn, Windows Live, FourSquare, Yahoo, Github, Instagram) and a local stragegy, i.e. simple username / email and password.

aurelia-auth is a port of the great [Satellizer](https://github.com/sahat/satellizer/) library to ES6 and packaged as an Aurelia plugin.

Other OAuth1 and Oauth2 than the above mentioned providers can be simply added by editing the extensible configuration file.

Basically, aurelia-auth does not use any cookies but relies on a JWT (json web token) stored in the local storage of the browser:

![JWT in local storage](./pictures/TokenViaDevelopmentTools.png)

Both **local storage** as well as **session storage** can be used (via the aurelia-auth security configuration file).

Spoonx/aurelia-auth makes use of [aurelia-api](https://github.com/SpoonX/aurelia-api) for convenient use of the aurelia-fetch-client. Options are available to directly use aurelia-fetch-client instead. If configured, the aurelia token will be sent automatically to your protected API when the user is authenticated.

![Authentication header](./pictures/authHeader.png)

## Installation
We assume that you know about ([NodeJs](https://nodejs.org/), [Gulp](http://gulpjs.com/)) and [Aurelia](http://aurelia.io/).
Since aurelia-auth is an [Aurelia plugin](https://github.com/aurelia/skeleton-plugin), we also assume that you have your [Aurelia](http://aurelia.io/) project up and running.

```
jspm install github:spoonx/aurelia-auth
```

## How to use aurelia-auth?
aurelia-auth does not contain any UI widgets. It's conceived as a simple service with following interface:
```
login(email, password)
logout(redirectUri)
authenticate(provider, redirect, userData)
signup(displayName, email, password)
getMe([criteria])
updateMe(data[,criteria]) 
isAuthenticated()
getTokenPayload()
unlink(provider)
```
Login is used for the local authentication strategy (email + password). Authenticate is for social media authentication. Authenticate is also used for linking a social media account to an existing account.

### Add an aurelia-auth security configuration file
Add an javascript file to your project where you will store the aurelia-auth  security configuration data. Call it for example authConfig.js.
Since this file is available via the browser, it should never contain sensitive data. Note that for OAuth the clientId is non sensitive. The client secret is sensitive data and should be only available server side. The aurelia-auth config file is compatible with the original Satellizer config file, easing the migration of AngularJs projects to Aurelia.

Spoonx/aurelia-auth uses [aurelia-api](https://github.com/SpoonX/aurelia-api). Set here the aurelia-api endpoint for the authorization requests and specify all endpoints you want to have configured for authorized requests. The aurelia token will be added to requests to those endpoints.

```js
var baseConfig = {
    endpoint: 'auth',
    configureEndpoints: ['auth', 'protected-api']
};

var configForDevelopment = {
    providers: {
        google: {
            clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com'
        }
        ,
        linkedin:{
            clientId: '778mif8zyqbei7'
        },
        facebook:{
            clientId: '1452782111708498'
        }
    }
};

var configForProduction = {
    providers: {
        google: {
            clientId: '239531826023-3ludu3934rmcra3oqscc1gid3l9o497i.apps.googleusercontent.com'
        }
        ,
        linkedin: {
            clientId:'7561959vdub4x1'
        },
        facebook: {
            clientId:'1653908914832509'
        }

    }
};

var config;
if (window.location.hostname === 'localhost') {
    config = Object.assign({}, baseConfig, configForDevelopment};
}
else {
    config = Object.assign({}, baseConfig, configForProduction};
}

export default config;

```
The above configuration file can cope with a development and production version (not mandatory of course). The strategy is that when your run on localhost, the development configuration file is used, otherwise the production configuration file is taken.

### Update the aurelia configuration file

In your aurelia configuration file, add the plugin and inject the aurelia-auth security configuration file.

While not mandantory, spoonx/aureli-auth is easiest to use in conjunction with [aurelia-api](https://github.com/SpoonX/aurelia-api). Aurelia-api allows to setup several endpoints for Rest services. This can be used to seperate public and protected routes. For that, we first need to register the endpoints with aurelia-api. Bellow we setup the endpoints 'auth' and 'protected-api'. These will be setup in the proceeding spoonx/aurelia-auth-plugin configuration for authorized access (specified in above authConfig.js example). The endpoint 'public-api' bellow could be used for public access only, since we didn't add it above to the 'configureEndpoints' array and thus the access token will not be added by aurelia-auth.

```javascript
import authConfig from './authConfig';

export function configure(aurelia) {
  aurelia.use
    /* Your other plugins and init code */
    .standardConfiguration()
    .developmentLogging()    
    /* setup the api endpoints first (if desired) */
    .plugin('spoonx/aurelia-api', configure=>{
      configure
        .registerEndpoint('auth', 'https://myapi.org/auth')
        .registerEndpoint('protected-api', 'https://myapi.org/protected-api')
        .registerEndpoint('public-api', 'http://myapi.org/public-api');
    })
    /* configure spoonx/aurelia-auth */
    .plugin('spoonx/aurelia-auth', baseConfig=>{
        baseConfig.configure(authConfig);
    });

    aurelia.start().then(a => a.setRoot());
}

```

### Provide a UI for a login, signup and profile.

See aurelia-auth-samples for more details.

Button actions are passed to the corresponding view model via a simple click.delegate:
```html
<button class="btn btn-block btn-google-plus" click.delegate="authenticate('google')">
          <span class="ion-social-googleplus"></span>Sign in with Google
</button>
```

The login view model will speak directly with the aurelia-auth service, which is made available via constructor injection.
```js
import {AuthService} from 'spoonx/aurelia-auth';
import {inject} from 'aurelia-framework';
@inject(AuthService)

export class Login {
    constructor(auth) {
        this.auth = auth;
    };

    heading = 'Login';

    email    = '';
    password = '';
    login() {
        return this.auth.login(this.email, this.password)
        .then(response=>{
            console.log("success logged " + response);
        })
        .catch(err=>{
            console.log("login failure");
        });
    };

    authenticate(name) {
        return this.auth.authenticate(name, false, null)
        .then(response=>{
            console.log("auth response " + response);
        });
    }
}
```

On the profile page, social media accounts can be linked and unlinked. For a nice UI experience, use  if.bind for either showing the link or unlink button:
```html
<button class="btn btn-sm btn-danger" if.bind="profile.facebook" click.delegate="unlink('facebook')">
    <i class="ion-social-facebook"></i> Unlink Facebook Account
</button>
<button class="btn btn-sm btn-primary" if.bind="!profile.facebook" click.delegate="link('facebook')">
    <i class="ion-social-facebook"></i> Link Facebook Account
</button>
```
### Making the Aurelia Router authentication aware

The logout and profile links are only shown when the user is authenticated, whereas the login link is only visible when the user is not authenticated.

```html
<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
    <ul class="nav navbar-nav">
        <li repeat.for="row of router.navigation | authFilter: isAuthenticated" class="${row.isActive ? 'active' : ''}">
            <a data-toggle="collapse" data-target="#bs-example-navbar-collapse-1.in" href.bind="row.href">${row.title}</a>
        </li>
    </ul>

    <ul if.bind="!isAuthenticated" class="nav navbar-nav navbar-right">
        <li><a href="/#/login">Login</a></li>
        <li><a href="/#/signup">Sign up</a></li>
    </ul>
    <ul if.bind="isAuthenticated" class="nav navbar-nav navbar-right">
        <li><a href="/#/profile">Profile</a></li>
        <li><a href="/#/logout">Logout</a></li>
    </ul>

    <ul class="nav navbar-nav navbar-right">
        <li class="loader" if.bind="router.isNavigating">
            <i class="fa fa-spinner fa-spin fa-2x"></i>
        </li>
    </ul>
</div>
```
Menu items visibility can also be linked with the authFilter to the isAuthenticated value.

In the router config function, you can specifify an auth property in the routing map indicating wether or not the user needs to be authenticated in order to access the route:

```js
configure(){
    var appRouterConfig = function(config){
        config.title = 'Aurelia';
        config.addPipelineStep('authorize', AuthorizeStep); // Add a route filter to the authorize extensibility point.

        config.map([
            { route: ['','welcome'],  moduleId: './welcome',  nav: true, title: 'Welcome' },
            { route: 'flickr',        moduleId: './flickr',   nav: true, title: 'Flickr' },
            { route: 'customer',      moduleId: './customer', nav: true, title: 'CRM', auth: true },

            ...

            ]);
        };

        this.router.configure(appRouterConfig);
    }
```
In the above example the customer route is only available for authenticated users.

## Full configuration options.

Via the above mentioned configuration virtually all aspects of the authentication process be tweaked:

```js
  httpInterceptor: true,
  endpoint: null,
  configureEndpoints: null,
  loginOnSignup: true,
  baseUrl: '/',
  loginRedirect: '/#customer',
  logoutRedirect: '/',
  signupRedirect: '/login',
  loginUrl: '/auth/login',
  signupUrl: '/auth/signup',
  profileUrl: '/auth/me',
  loginRoute: '/login',
  signupRoute: '/signup',
  tokenRoot: false,
  tokenName: 'token',
  tokenPrefix: 'aurelia',
  unlinkUrl: '/auth/unlink/',
  unlinkMethod: 'get',
  authHeader: 'Authorization',
  responseTokenProp: 'access_token',
  authToken: 'Bearer',
  withCredentials: true,
  platform: 'browser',
  storage: 'localStorage',
  providers: {
    google: {
      name: 'google',
      url: '/auth/google',
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      scope: ['profile', 'email'],
      scopePrefix: 'openid',
      scopeDelimiter: ' ',
      requiredUrlParams: ['scope'],
      optionalUrlParams: ['display'],
      display: 'popup',
      type: '2.0',
      /*clientId: '239531826023-ibk10mb9p7ull54j55a61og5lvnjrff6.apps.googleusercontent.com',*/
      popupOptions: { width: 452, height: 633 }
    },
    facebook: {
      name: 'facebook',
      url: '/auth/facebook',
      authorizationEndpoint: 'https://www.facebook.com/v2.3/dialog/oauth',
      redirectUri: window.location.origin + '/' || window.location.protocol + '//' + window.location.host + '/',
      scope: ['email'],
      scopeDelimiter: ',',
      nonce: function() {
        return Math.random();
      },
      requiredUrlParams: ['nonce','display', 'scope'],
      display: 'popup',
      type: '2.0',
      popupOptions: { width: 580, height: 400 }
    },
    linkedin: {
      name: 'linkedin',
      url: '/auth/linkedin',
      authorizationEndpoint: 'https://www.linkedin.com/uas/oauth2/authorization',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      requiredUrlParams: ['state'],
      scope: ['r_emailaddress'],
      scopeDelimiter: ' ',
      state: 'STATE',
      type: '2.0',
      popupOptions: { width: 527, height: 582 }
    },
    github: {
      name: 'github',
      url: '/auth/github',
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      optionalUrlParams: ['scope'],
      scope: ['user:email'],
      scopeDelimiter: ' ',
      type: '2.0',
      popupOptions: { width: 1020, height: 618 }
    },
    yahoo: {
      name: 'yahoo',
      url: '/auth/yahoo',
      authorizationEndpoint: 'https://api.login.yahoo.com/oauth2/request_auth',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      scope: [],
      scopeDelimiter: ',',
      type: '2.0',
      popupOptions: { width: 559, height: 519 }
    },
    twitter: {
      name: 'twitter',
      url: '/auth/twitter',
      authorizationEndpoint: 'https://api.twitter.com/oauth/authenticate',
      type: '1.0',
      popupOptions: { width: 495, height: 645 }
    },
    live: {
      name: 'live',
      url: '/auth/live',
      authorizationEndpoint: 'https://login.live.com/oauth20_authorize.srf',
      redirectUri: window.location.origin || window.location.protocol + '//' + window.location.host,
      scope: ['wl.emails'],
      scopeDelimiter: ' ',
      requiredUrlParams: ['display', 'scope'],
      display: 'popup',
      type: '2.0',
      popupOptions: { width: 500, height: 560 }
    }
  }
```

More non Aurelia specific details can be found on the [Sattelizer Github page](https://github.com/sahat/satellizer/).
