module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 4);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

module.exports = require("es6-promisify");

/***/ },
/* 1 */
/***/ function(module, exports) {

module.exports = require("jsonwebtoken");

/***/ },
/* 2 */
/***/ function(module, exports) {

module.exports = require("koa-unless");

/***/ },
/* 3 */
/***/ function(module, exports) {

module.exports = require("util");

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromAuthorizationHeader = exports.fromCookies = exports.sign = exports.decode = exports.verify = undefined;

var _jsonwebtoken = __webpack_require__(1);

var _jsonwebtoken2 = _interopRequireDefault(_jsonwebtoken);

var _koaUnless = __webpack_require__(2);

var _koaUnless2 = _interopRequireDefault(_koaUnless);

var _util = __webpack_require__(3);

var _es6Promisify = __webpack_require__(0);

var _es6Promisify2 = _interopRequireDefault(_es6Promisify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

const verifyAsync = (0, _es6Promisify2.default)(_jsonwebtoken.verify, _jsonwebtoken2.default);
const decodeAsync = (0, _es6Promisify2.default)(_jsonwebtoken.decode, _jsonwebtoken2.default);

exports.verify = _jsonwebtoken.verify;
exports.decode = _jsonwebtoken.decode;
exports.sign = _jsonwebtoken.sign;

exports.default = (opts = {}) => {

  if (!opts.secret) {
    throw new Error("secret must be specified");
  }

  if (!opts.extractToken || !(0, _util.isFunction)(opts.extractToken)) {
    throw new Error("token extraction strategy must be specified and should be a function");
  }

  if (opts.checkRevoked && !(0, _util.isFunction)(opts.checkRevoked)) {
    throw new Error("token revokation check must be a function");
  }

  const {
    secret,
    key = "user",
    extractToken,
    checkRevoked = false
  } = opts;

  const middleware = (() => {
    var _ref = _asyncToGenerator(function* (ctx, next) {
      try {
        const accessToken = extractToken(ctx, opts);
        const decodedToken = yield verifyAsync(accessToken, secret, opts);
        const isRevoked = checkRevoked ? yield checkRevoked(decodedToken, opts) : false;
        if (isRevoked) {
          throw new Error("jwt revoked");
        }
        ctx.state = ctx.state || {};
        ctx.state[key] = decodedToken;
        yield next();
      } catch (e) {
        const msg = `Invalid token - ${ e.message }`;
        ctx.throw(401, msg);
      }
    });

    return function middleware(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })();

  middleware.unless = _koaUnless2.default;

  return middleware;
};

const fromCookies = exports.fromCookies = (ctx, opts) => {
  if (opts.cookie && ctx.cookies.get(opts.cookie)) {
    return ctx.cookies.get(opts.cookie);
  } else {
    throw new Error(`the specified cookie was not found\n`);
  }
};

const fromAuthorizationHeader = exports.fromAuthorizationHeader = (ctx, opts) => {
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
};

/***/ }
/******/ ]);
//# sourceMappingURL=index.js.map