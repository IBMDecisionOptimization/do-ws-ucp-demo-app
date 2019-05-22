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

function configCB(workspace) {

        scenariocfg = config.scenario;
        scenariocfg["$scenario"] = { cb : showInputsAndOutputs }

        scenariomgr = new ScenarioManager(config.scenario, workspace);        

        scenariomgr.loadScenarios();
        
        let title = 'UnitCommitment Demo';
        if ( ('ui' in config) &&
                ('title' in config.ui) )
                title = config.ui.title;

        scenariogrid = new ScenarioGrid(title, 'scenario_grid_div', scenariomgr, {enableImport:true});


        if ('ui' in config && 'grid' in config.ui) {
                let url = './api/config/file?fileName='+config.ui.grid;
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
                }); 
        } else {
                // default
                scenariogrid.dodefaultdashboard();
        }

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
}


function showInputsAndOutputs(scenario) {
        scenariogrid.redraw();
}
