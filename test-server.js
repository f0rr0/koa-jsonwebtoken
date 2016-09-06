'use strict';
const Koa = require('koa');
const koajwt = require('./build/index.js').default;
const fromAuthorizationHeader = require('./build/index.js').fromAuthorizationHeader;
const sign = require('./build/index.js').sign;

const profile = {
  id: 123
};

const TOKEN = sign(profile, 'secret', { expiresIn: 1000 });

console.log('Starting koa-jwt test server on http://localhost:3000/');
console.log('');
console.log('You can test the server by issuing curl commands like the following:');
console.log('')
console.log('  curl http://localhost:3000/public/foo            # should succeed (return "unprotected")');
console.log('  curl http://localhost:3000/api/foo               # should fail (return "401 Unauthorized ...")');
console.log('  curl -H "Authorization: Bearer ' + TOKEN + '" http://localhost:3000/api/foo   # should succeed (return "protected")');
console.log('')

var app = new Koa();

// Custom 401 handling
// app.use(function(ctx, next){
//   return next().catch((err) => {
//     if (401 == err.status) {
//       ctx.status = 401;
//       ctx.body = '401 Unauthorized - Protected resource, use Authorization header to get access\n';
//     } else {
//       throw err;
//     }
//   });
// });

// Unprotected middleware
app.use(function(ctx, next){
  if (ctx.url.match(/^\/public/)) {
    ctx.body = 'unprotected\n';
  } else {
    return next();
  }
});

// Middleware below this line is only reached if JWT token is valid
app.use(koajwt({ secret: 'secret', extractToken: fromAuthorizationHeader }));

app.use(function(ctx){
  if (ctx.url.match(/^\/api/)) {
    ctx.body = 'protected\n';
  }
});

app.listen(3000);
