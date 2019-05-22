# UCP demo

This is a basic demonstrator of how to use the [do-ws-js](https://github.com/IBMDecisionOptimization/do-ws-js) library.

## Run the app locally

1. [Install Node.js](https://nodejs.org/en/download/)
1. cd into this project's root directory
1. Run `npm install` to install the app's dependencies
1. Run `npm start` to start the app
1. Access the running app in a browser using <http://localhost:6004>

![Screnshot](/images/ucp.png)

You can run other configurations (i.e. other applications) using for example <http://localhost:6004?workspace=sd>


## How it works

### Dependencies

The nodejs package.json file lists dependencies on the do-ws-js package, along with some post install step to copy the js files into the public subdirectory.

```
 "scripts": {
    "postinstall": "copyfiles -f node_modules/do-ws-js/public/*.js public/do-ws-js && copyfiles -f node_modules/do-ws-js/public/stylesheets/*.css public/do-ws-js/stylesheets",
    "start": "node app.js"
  },
  "dependencies": {
    "axios": "^0.17.1",
    "body-parser": "x",
    "cfenv": "1.0.x",
    "express": "4.15.x",
    "multer": "x",
    "request": "2.83.x",
    "do-ws-js": ">=0.1.55"
  },
  ```
  
## The code

### Front end side
  
The HTML code is completely generic:
* public/index.html includes all required dependencies, and the main.js file
* public/main.js if the main file.
  
In the load() function it loads the config form the back end:
```
function load() {               
        workspace = location.search.split('workspace=')[1]
        if (workspace == undefined)
                workspace = "default";
        getConfig(workspace, configCB);

};
```

Then the configuration callback is called and:
* create a scenario manager,
* loads the scenarios from the back-end,
* creates a scenario grid 
using the configurations received.
```
function configCB(workspace) {
        scenariocfg = config.scenario.config;
        scenariocfg["$scenario"] = { cb : showInputsAndOutputs }

        scenariomgr = new ScenarioManager(scenariocfg, workspace);        

        scenariomgr.loadScenarios();
        
        let title = 'UnitCommitment Demo';
        if ( ('ui' in config) &&
                ('title' in config.ui) )
                title = config.ui.title;
        document.title = title;
        scenariogrid = new ScenarioGrid(title, 'scenario_grid_div', scenariomgr, {enableImport:true});
}
```

### Back-end side
The back end side code app.js file is also completely generic.

It imports the modules and call the function so that the APIs are setup.
```
var dods = require('do-ws-js/dods');
dods.routeScenario(router);
dods.routeSolve(router);
var dodsxpa = require('do-ws-js/dodsxpa');
dodsxpa.routeConfig(router);
dodsxpa.routeDSX(router);
```

### Confiuguration files

For each application (that can be used with workspace=XXX), there is a configuration file under config/XXX/config.json
It looks like (this one if the default one when no workspace is given):
```
{
    "name": "UCP",
    "scenario" : {        
        "config" : {
            "Units" : { "id":"Units", "title":"Units", "allowEdition":true},        
            "Loads" : {  "id":"Periods", "title":"Load", "allowEdition":true},
            "UnitMaintenances" : {"id":null, "title":"Maintenances", "allowEdition":true, "maxSize":1680},
            "Periods" : { "id":"Id", "title":"Periods"},
            "Weights" : { "id":"Id", "title":"Weights", "allowEdition":true},

            "production" : { "title":"Production", "columns": ["Units", "Periods", "value"] },
            "started" : { "title":"Started", "columns": ["Units", "Periods", "value"]},
            "used" : { "title":"Used", "columns": ["Units", "Periods", "value"]},
            "kpis" : { "id":"kpi", "title":"KPIs"}
        }
    },
    "dsx" : {
        "type" : "local",
        "apiurl": "https://xxxxxx
        "url": "https://xxxxx
        "login": "alain.chabrier@ibm.com",
        "password": "Hot6cold",
        "projectName": "PA3"
      },
    "do" : {  
        "url":  "https://api-oaas.docloud.ibmcloud.com/job_manager/rest/v1/",
        "key": "api_xxxxxxxxxxxxxxxxxxxxxxxxx",
        "model": "model.py"
    },
    "ui" : {
        "title": "Unit Commitment",
        "grid" : "grid.js"
    }

}
```

The scenario part allows to provide some configuration on the different tables (input and output) used in the scenarios.
The dsx part allows to connect to some Watson Studio Local instance toimport models and data.
the do part allows to confugure how optimizationis run
The ui parts allows to configure some additional UI properties, including the use of a separate JS file which will do some more precise setup of the gridlayout.
