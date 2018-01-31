Scenarios

- User is authenticated via SSO but not via App
Expected outcome:
User is automatically logged into the App

- User has never registered via SSO
Expected outcome:
User is able to register for a new account or skip it via a social IDP

- User logs in via SSO and then changes from App1 to App2
Expected outcome:
Authenticated session is automatically activated in App2

- User logs in via SSO but has never used App
Expected outcome:
If necessary, redirect user to complete registration for the App

- Existing user logs in via new SSO IDP
Expected outcome:
User is automatically matched to existing User

- User wants to use 2FA
Expected outcome:
User is able to enable 2FA

- User logs in with 2FA
Expected outcome:
User is prompted for 2FA during login process

- User enters email associated with corporate SSO
Expected outcome:
Login process will automatically redirect corporate SSO user to corporate SSO authentication mechanism

- User logs in via corporate SSO
Expected outcome:
Login process will automatically redirect corporate SSO user to corporate SSO authentication mechanism
