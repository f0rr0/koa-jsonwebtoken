# koa-jsonwebtoken

Koa middleware to validate/revoke/refresh JSON Web Tokens. Sets `ctx.state.user`(default) to token payload.

## Install

```
$ npm install koa-jsonwebtoken
```

### Retrieving the token

The token extraction strategy needs to be specified explicitly by setting `opts.extractToken`. The module provides two strategies namely `fromAuthorizationHeader` and `fromCookies`. The token is normally provided in a HTTP header (`Authorization`), but it can also be provided in a cookie by setting the `opts.cookie` option to the name of the cookie that contains the token. Custom token retrieval function should match the following interface:

```js
/**
 * Your custom token resolver
 * @param  {object}       ctx object passed to the middleware
 * @param  {object}       middleware's options
 * @return {String|null}  resolved token or null if not found
 */
```

### Passing the secret

A single shared secret needs to be specified explicitly in `opts.secret`.

### Check for revocation

In case you maintain a blacklist for the purpose of token revokation, you can specify a custom function to check for revocation by setting `opts.checkRevoked`. The function should match the following interface:

```js
/**
 * Your custom token revocation check function
 * @param  {object}       decoded token
 * @param  {object}       middleware's options
 * @return {Promise}      Promise resolves with anything or rejects with {message: "reason"}
 */
```

### Refresh token

To refresh your tokens in case they are expired and do so in a manner transparent to the user, you can set `opts.refreshCookie` to the name of the cookie where the server will expect the refresh token. You also need to specify `opts.doRefresh` with a custom function which will carry out the refresh logic/validate the refresh token. The function should match the following interface:

```js
/**
 * Your custom token refresh function
 * @param  {object}       ctx object passed to the middleware
 * @param  {object}       middleware's options
 * @param  {string}       refresh token from the specified cookie
 * @param  {object}       decoded access token
 * @return {Promise}      Promise resolves with anything or rejects with {message: "reason"}
 */
```
Note: `ctx.state[opts.key]` is set to the stale payload after your custom function returns. Don't modify critical payload fields if you depend on them in your application.

## Example

```js
import koa from 'koa';
import jwt, { fromAuthorizationHeader } from 'koa-jsonwebtoken';
// const jwt = require('koa-jsonwebtoken').default;
// const fromAuthorizationHeader = require('koa-jsonwebtoken').fromAuthorizationHeader;
const app = koa();

// Custom 401 handling if you don't want to expose koa-jsonwebtoken errors to users
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (401 == err.status) {
      ctx.throw(401, 'Protected resource, use Authorization header to get access\n');
    } else {
      ctx.throw(500, err.message);
    }
  }
});

// Unprotected middleware
app.use(async (ctx, next) => {
  if (ctx.url.match(/^\/public/)) {
    ctx.body = 'unprotected\n';
  } else {
    await next();
  }
});

// Middleware below this line is only reached if JWT token is valid
app.use(jwt({ secret: 'shared-secret', extractToken: fromAuthorizationHeader }));

// Protected middleware
app.use((ctx) => {
  if (ctx.url.match(/^\/api/)) {
    ctx.body = 'protected\n';
  }
});

app.listen(3000);
```


Alternatively you can conditionally run the `jwt` middleware under certain conditions:

```js
import koa from 'koa';
import jwt, { fromAuthorizationHeader } from 'koa-jsonwebtoken';
const app = koa();

// Middleware below this line is only reached if JWT token is valid
// unless the URL starts with '/public'
app.use(jwt({ secret: 'shared-secret', extractToken: fromAuthorizationHeader }).unless({ path: [/^\/public/] }));

// Unprotected middleware
app.use(async (ctx, next) => {
  if (ctx.url.match(/^\/public/)) {
    ctx.body = 'unprotected\n';
  } else {
    await next();
  }
});

// Protected middleware
app.use((ctx) => {
  if (ctx.url.match(/^\/api/)) {
    ctx.body = 'protected\n';
  }
});

app.listen(3000);
```

For more information on `unless` exceptions, check [koa-unless](https://github.com/Foxandxss/koa-unless).

If you prefer to use another ctx key for the decoded data, just pass in `key`, like so:
```js
app.use(jwt({ secret: 'shared-secret',
              extractToken: fromAuthorizationHeader,
              key: 'jwtdata' }));
```
This makes the decoded data available as `ctx.state.jwtdata`.

You can specify options to control the verification as well. See [node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) for more options:
```js
app.use(jwt({ secret:   'shared-secret',
              audience: 'http://myapi/protected',
              issuer:   'http://issuer' }));
```
If the JWT has an expiration (`exp`), it will be checked.


This module also support tokens signed with public/private key pairs. Instead
of a secret, you can specify a Buffer with the public key:

```js
var publicKey = fs.readFileSync('/path/to/public.pub');
app.use(jwt({ secret: publicKey }));
```

## Related Modules

- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JSON Web Token signing
and verification

Note that koa-jsonwebtoken exports the `sign`, `verify` and `decode` functions from the above module as a convenience.

## Test Server

    $ npm install
    $ npm run test

## Author

Sid Jain

## Credits

This code is largely based on:
  [koa-jwt](https://github.com/koajs/jwt) (unmaintained).

## License

[The MIT License](http://opensource.org/licenses/MIT)
