import jwt, { verify, decode, sign } from "jsonwebtoken";
import unless from "koa-unless";
import { isFunction } from "util";
import promisify from "es6-promisify";

const verifyAsync = promisify(verify, jwt);

export { verify, decode, sign };

export default (opts = {}) => {

  if (!opts.secret) {
    throw new Error("secret must be specified");
  }

  if (!opts.extractToken || !isFunction(opts.extractToken)) {
    throw new Error("token extraction strategy must be specified and should be a function");
  }

  if (opts.checkRevoked && !isFunction(opts.checkRevoked)) {
    throw new Error("token revokation check must be a function");
  }

  if (opts.doRefresh && !isFunction(opts.doRefresh)) {
    throw new Error("token refresh strategy must be specified and should be a function");
  }

  const {
    secret,
    key = "user",
    extractToken,
    checkRevoked = false,
    doRefresh = false
  } = opts;

  const middleware = async (ctx, next) => {
    try {
      const accessToken = extractToken(ctx, opts);
      const decodedToken = await verifyAsync(accessToken, secret, opts);
      if (checkRevoked) {
        await checkRevoked(decodedToken, opts);
      }
      ctx.state = ctx.state || {};
      ctx.state[key] = decodedToken;
    } catch (e) {
      if (e.message === "jwt expired" && doRefresh) {
        try {
          const refreshToken = fromCookies(ctx, opts, true);
          const accessToken = extractToken(ctx, opts);
          const decodedAccessToken = await verifyAsync(accessToken, secret, { ignoreExpiration: true });
          await doRefresh(ctx, opts, refreshToken, decodedAccessToken);
          ctx.state = ctx.state || {};
          ctx.state[key] = decodedAccessToken;
        } catch (e) {
          ctx.throw(401, `Invalid token - ${e.message}`);
        }
        await next();
      } else ctx.throw(401, `Invalid token - ${e.message}`);
    }
    await next();
  }

  middleware.unless = unless;

  return middleware;

}

export const fromCookies = (ctx, opts, refresh=false) => {
  if (refresh) {
    if (opts.refreshCookie && ctx.cookies.get(opts.refreshCookie)) {
      return ctx.cookies.get(opts.refreshCookie);
    } else {
      throw new Error(`the refresh cookie was not found\n`);
    }
  } else if (opts.cookie && ctx.cookies.get(opts.cookie)) {
    return ctx.cookies.get(opts.cookie);
  } else {
    throw new Error(`the specified cookie was not found\n`);
  }
}

export const fromAuthorizationHeader = (ctx, opts) => {
  if (!ctx.header || !ctx.header.authorization) {
    throw new Error(`can't find authorization header`);
  }
  const parts = ctx.header.authorization.split(" ");
  if (parts.length === 2) {
    const scheme = parts[0];
    const credentials = parts[1];
    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    } else {
      throw new Error(`Bad Authorization header format. Format is "Authorization: Bearer token"\n`);
    }
  } else {
    throw new Error(`Bad Authorization header format. Format is "Authorization: Bearer token"\n`);
  }
}
