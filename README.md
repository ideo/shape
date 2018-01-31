# Getting Started

The SSO tool set is divided into two parts:

- [SSO Frontend Widget](#frontend-authentication-widget) - user sign in, session revival and logged-in profile dropdown.
- [Backend oAuth / Open ID Connect](#backend-oauth-open-id-connect) - used to receive user authentication callbacks, tokens and profile data.

## Demo App

You can view this demo app at [ideo-sso-demo.herokuapp.com](https://ideo-sso-demo.herokuapp.com/). It is intended to showcase some of the functionality of the SDK and serve as an implementation example.


## Frontend Authentication Widget

The IDEO Network app (currently at ideo-sso-profile.herokuapp.com) operates as the single point of authentication for all users, which will handle all of the login, registration and forgot password flows. Once a user authenticates with the IDEO Network app, they will be redirected to your oAuth flow.

The authentication UX operates similarly to how Google Accounts allows you to login via a unified sign-in form across products, and modify global profile details via that app.

Primarily what you'll use the JS SDK for are:
- Checking if user is already authenticated to the IDEO Network
  - If network session exists, reviving their session on your app seamlessly.
  - If not, redirecting them to the profile tool to login or register.
- Logging a user out at the IDEO network level when they sign out of your app.
- Displaying a user signed-in profile widget. It displays a profile picture and links for the user to edit their account settings (e.g. email, password, authentication methods).

#### Include the JS SDK in your project

```html
<script type="text/javascript" src="https://d3none3dlnlrde.cloudfront.net/1.0/js/ideo-sso-js-sdk.min.js"></script>
```

#### Whitelist Your Domains

**IMPORTANT:** In order for redirection after authentication to work, you must send an IDEO SSO administrator the domains you need to have whitelisted.

Send the following information:

- Application name
- Primary contact info
- Domains to be whitelisted
  - Include the full host and subdomain for production and dev/staging apps.
  - e.g. ideo.creativedifference.com, c-delta-staging.herokuapp.com

In return, the administrator will send you your _OKTA Client ID_ and _OKTA Client Secret_ which you'll need in the coming steps.


#### Initialize the JS SDK

You'll want to include this within your `<head></head>` tag so that you can use the `IdeoSSO` javascript SDK:

```html
<script>
  IdeoSSO.init({
    client: '{{OKTA_CLIENT_ID}}',
    redirect: '{{OKTA_REDIRECT_URL}}'
  });
</script>
```

- `OKTA_CLIENT_ID` unique to your application, obtained from an administrator of the IDEO SSO program
- `OKTA_REDIRECT_URL` this should be the URL where the oAuth callback will be sent
  - e.g. ideo.creativedifference.com/oauth/okta/callback

#### JS SDK API

When a user chooses to login, it is recommended that you check if a session already exists at the network level.

#### `IdeoSSO.signIn`: redirect user into authentication flow

```
IdeoSSO.signIn()
returns: undefined
```

Redirect a user into the network tool's authorization flow. An authenticated user will be returned to your callback URL per the oAuth flow.

```html
<button onclick="IdeoSSO.signIn();">Register / Login</button>
```

------


#### `IdeoSSO.logout`: logout an existing session from the SSO network

```
IdeoSSO.logout(redirectUrl)
params:
  - redirectUrl - String (optional)
returns: Promise
```

Logs out an existing user session (if one exists) and redirects to an optional redirectUrl [(example)](https://github.com/ideo/sso-demo-rails/blob/6b35e1feadb2af3e3a9bf857c3d30f5ca39e8f48/app/views/layouts/application.html.erb#L74)

```js
IdeoSSO.logout('/user/logout');
```

------


#### `IdeoSSO.getSettingsUrl`: return the profile settings page URL

```
IdeoSSO.getSettingsUrl()
returns: String
```

Returns a link where users can access their account settings and logout.



## Backend oAuth / Open ID Connect

This is part of the authentication flow that you'll now use to receive user authentication callbacks, tokens and profile data.

### Authorization Code Callback

The OpenID Connect flow we use is described in detail as the [authorization code flow](https://developer.okta.com/authentication-guide/implementing-authentication/auth-code).

Essentially, upon successful authentication the user will be redirected back to our server with the following URL params:

- `code` - the authorization code to verify with OKTA
- `state` - the state code to verify with our user's cookie

You can find lots of libraries to help with validating the OpenID Connect authorization code. The general principle is that you will exchange the authorization code along with your _OKTA Application Secret_ for an `id_token` and `access_token` that grant you information about the user and access to the user respectively.


#### State param validity

The part of the flow that you need to do manually within your application is check the `state` param for validity. A cookie named `IdeoSSO-State` is set automatically by the Frontend Widget on the client domain.

For security verify that the `state` query param received in the Authorization Code redirect matches the `IdeoSSO-State` cookie on the client machine [(example)](https://github.com/ideo/sso-demo-rails/blob/master/config/initializers/devise.rb#L3)


## Questions?

Contact [mwinkler@ideo.com](mailto:mwinkler@ideo.com) or [jschwartzman@ideo.com](mailto:jschwartzman@ideo.com) for support.
