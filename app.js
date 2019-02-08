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
app.use(bodyParser.json())

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var dods = require('do-ws-js/dods');

dods.routeScenario(router);


OPTIM_URL = 'https://bcp.datascienceelite.com/dsvc/v1/pa3/domodel/ucp/model/UCPSAVED'
OPTIM_KEY = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFsYWluLmNoYWJyaWVyQGlibS5jb20iLCJwYWNrYWdlTmFtZSI6IlBBMyIsInBhY2thZ2VSb3V0ZSI6InBhMyIsImlhdCI6MTU0NDAwMTQyM30.iCnpLeIt8cSpSK8ysdyrnyM4phsnjcOgex-B1N-ZSzYOH6J9v9DHy3C00XfP1S8NeehK-dVbBrWBbXdIgpDHOE2kG7D88t5Cb4hlHt65dyE5HmQcJQm6HHLQeLy2TWmIRUOlJHZlBCKHS9_V_Ek9ySMx6K5fQkNUziQxyH_bvcN3laoRBBUAVpG4OAz67W2kaPqvla1wu3_XOgFTj-48_CTPpm-i5FUQZ9x1eGgQNygnmBiES9qIp6voe_7V6O3mzni6zPmYjkdfQjUP4Aa8FL_eHWcak8beaSEv39ED5Ifk0F2WvOOAmCu-913kfmV2Kmn1WdCB399bLNTgOFIo3w"
//OPTIM_URL = 'https://api-oaas.docloud.ibmcloud.com/job_manager/rest/v1/'
//OPTIM_KEY = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
//OPTIM_MODEL = 'model.py'

dods.routeSolve(router, OPTIM_URL, OPTIM_KEY /*, OPTIM_MODEL*/ );


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
