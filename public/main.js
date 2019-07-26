workspace = undefined;
config = undefined;
scenariomgr = undefined;
scenariogrid = undefined;
scenariocfg = undefined;

function getConfig(workspace, cb) {
        axios({
                method:'get',
                url:'./api/config?workspace='+workspace,
                responseType:'json'
              })
        .then(function (response) {
                config = response.data;

                console.log("Config:");
                console.log(config);

                cb(workspace)
        });
}

function testui() {
      
 

}
var initDone = false;
function initGrid() {
        initDone = true;
        //testui();
        // return;
        if ('ui' in config) {
                if ( 'gridjs' in config.ui) {
                        let url = './api/config/file?fileName='+config.ui.gridjs;
                        if (workspace != undefined)
                                url += '&workspace='+workspace;
                        axios({
                                method:'get',
                                url:url,
                                responseType:'text/plain'
                        })
                        .then(function (response) {
                                let grid = response.data;
                                eval(grid);
                                scenariogrid.redraw();
                        }); 
                }
                if ('widgets' in config.ui) {
                        scenariogrid.init(config.ui.widgets)
                }
        } else {
                // default
                scenariogrid.dodefaultdashboard();
                scenariogrid.redraw();
        }
}
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
function load() {               

        workspace = location.search.split('workspace=')[1]
        if (workspace == undefined)
                workspace = "default";
        getConfig(workspace, configCB);

};


function onChangeScenario() {
        console.log("Selected scenario " + scenariomgr.getSelectedScenario().getName());
        let scenario = scenariomgr.getSelectedScenario();
        
        showInputsAndOutputs(scenario);       

        if ('pa' in config)
                if ('mapping' in config.pa)
                        if ('output' in config.pa.mapping)
                                if ('version' in config.pa.mapping.output)
                                        config.pa.mapping.output.version = scenario.getName();
}


function showInputsAndOutputs(scenario) {
        if (!initDone)
                initGrid();
        scenariogrid.redraw();
}
