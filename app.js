/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use('/', express.static(__dirname + '/public'));

var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json({limit: '50mb'}))

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var dods = require('do-ws-js/dods');

dods.routeScenario(router);

dods.routeSolve(router);

dods.routeScore(router);

var dodsxpa = require('do-ws-js/dodsxpa');

dodsxpa.routeConfig(router);

dodsxpa.routeDSX(router);

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
