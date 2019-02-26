# UCP demo

This is a basic demonstrator of how to use the [do-ws-js](https://github.com/IBMDecisionOptimization/do-ws-js) library.


## Run the app locally

1. [Install Node.js][]
1. cd into this project's root directory
1. Run `npm install` to install the app's dependencies
1. Run `npm start` to start the app
1. Access the running app in a browser using either
  * <http://localhost:6004> for the standard version
  * <http://localhost:6004/index-grid.html> for the grid version
dic
[Install Node.js]: https://nodejs.org/en/download/

![Screnshot](/images/ucp.png)

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
    "do-ws-js": ">=0.1.11"
  },
  ```
  
### HTML code 
  
The HTML code is standard. index.html/index-grid.html includes all required dependencies, and suggests some layout for the different divs that will be used.
  
The real code is in main.js/main-grid.js
  
### main.js / main-grid.js
  
This is the real code.  Important part is the scenario configuration
  
The scenario configuration :
 * sets which tables must be used by the application (can be a subset of really existing tables)
 * allows to define an id
 * allows to set some table as editable
 
```
scenariocfg = {        
        'units' : { id:"Units", title:"Units", allowEdition:true},        
        'loads' : {  id:"Periods", title:"Load", allowEdition:true},
        'UnitMaintenances' : {title:"Maintenances", allowEdition:true},
        'periods' : { id:"Id", title:"Periods"},

        'production' : { title:"Production"},
        'started' : { title:"Started"},
        'used' : { title:"Used"},
        'kpis' : { id:'kpi', title:"KPIs"},

        "$scenario" : { cb : showInputsAndOutputs }
};
```

Some other important part is to create a scneario manager, and load scenarios:
```
scenariomgr = new ScenarioManager();        
scenariomgr.loadScenarios(scenariocfg);
scenariomgr.showAsSelector(`scenario_div`, onChangeScenario);
```

Here the onChangeScenario function will be called each time anotehr scenario is selected.

The calle function should update the displayed scenario.

There are many ways to display scenario, for example using:
```
showAsGoogleTables(scenario, 'inputs_div', 'input',
                ['units', 'loads', 'UnitMaintenances'],
                 scenariocfg)
```

### app.js

The app.js file is the usual node js entry point.

The only important thing to do here is to use the right configuration for decision optimization that is used to initialize the DO backend APIs.

The values in the goithub repository are not valid. You should replace by the corresponding URL/TOKEn from your deployed model.




