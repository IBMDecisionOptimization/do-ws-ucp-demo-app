
jobId = undefined

intervalId = ''

scenariomgr = undefined;

scenariocfg = {        
        'units' : { id:"Units", title:"units", allowEdition:true},        
        'loads' : {  id:"Periods", title:"Load", allowEdition:true},
        'UnitMaintenances' : {title:"Maintenances", allowEdition:true},
        'periods' : { id:"Id", title:"Periods"},

        'production' : { title:"Production"},
        'started' : { title:"Started"},
        'used' : { title:"Used"},
        'kpis' : { id:'kpi', title:"KPIs"},

        "$scenario" : { cb : showInputsAndOutputs }
};

assignments_data = undefined;
assignments_qty = undefined;

function load() {               
        disableSolve();

        document.getElementById("SOLVE").onclick = solve;


        scenariomgr = new ScenarioManager();        
        scenariomgr.loadScenarios(scenariocfg);
        scenariomgr.showAsSelector(`scenario_div`, onChangeScenario);

        cleanSolve();
        initOptim();
};

function onChangeScenario() {
        console.log("Selected scenario " + scenariomgr.getSelectedScenario().getName());
        let scenario = scenariomgr.getSelectedScenario();
        
        showInputsAndOutputs(scenario);
       
        showSolution(scenario);
}


function initOptim() {
        console.log("Init Optim.");
        axios({
                method:'get',
                url:'/api/optim/config',
                responseType:'text'
              })
        .then(function (response) {
                obj = response.data;
                solveUrl = obj.deploymentDescription.links[1].uri
                console.log("Solve URL :" + solveUrl);                        
                enableSolve();
        })
        .catch(showHttpError);     
}




function showInputsAndOutputs(scenario) {
        if (scenario != scenariomgr.getSelectedScenario())
                return;
        if (scenario == undefined)
                return;
        showAsGoogleTables(scenario, 'inputs_div', 'input',
                undefined,
                 scenariocfg)
        
        showSolution(scenario);

        showKpis(scenario);
        
}

function disableSolve() {
        document.getElementById('SOLVE').disabled = true;
}

function enableSolve() {
        document.getElementById('SOLVE').disabled = false;
        document.getElementById('SOLVE').value = 'SOLVE';
}

function solve() {
        var data = new FormData();

        let scenario = scenariomgr.getSelectedScenario();
        let tableIds = scenario.getInputTables()
        for (t in tableIds)  {
                let tableId = tableIds[t];
                data.append(tableId+".csv", scenario.getTableAsCSV(tableId));
        }


        document.getElementById('SOLVE').disabled = true;
        document.getElementById('SOLVE').value = 'STARTING';
        //document.getElementById('gantt_div').style.display="none";
        
        axios({
                method: 'post',
                url: './api/optim/solve',
                data: data
        }).then(function(response) {
                jobId = response.data.jobId                        
                console.log("Job ID: "+ jobId);
                intervalId = setInterval(checkStatus, 1000)
        }).catch(showHttpError);
}

function formatDate(d) {
        return d.getFullYear()  + "/" + 
        ("00" + (d.getMonth() + 1)).slice(-2) + "/" +
    ("00" + d.getDate()).slice(-2) + 
    " " + 
    ("00" + d.getHours()).slice(-2) + ":" + 
    ("00" + d.getMinutes()).slice(-2) + ":" + 
    ("00" + d.getSeconds()).slice(-2);
}

function checkStatus() {
        let scenario = scenariomgr.getSelectedScenario();
        axios.get("/api/optim/status?jobId="+jobId)
        .then(function(response) {
                executionStatus = response.data.solveState.executionStatus
                console.log("JobId: "+jobId +" Status: "+executionStatus)
                document.getElementById('SOLVE').value = executionStatus;
                                
                if (executionStatus == "PROCESSED" ||
                        executionStatus == "INTERRUPTED" ) {
                        clearInterval(intervalId);
                        
                        let nout = response.data.outputAttachments.length;
                        for (var i = 0; i < nout; i++) {
                                let oa = response.data.outputAttachments[i];
                                scenario.addTableFromRows(oa.name, oa.table.rows, 'output', scenariocfg[oa.name]);   
                        }

                        //document.getElementById('gantt_div').style.display="block";
                        showSolution(scenario);
                        showKpis(scenario);
                        enableSolve();

                }   
        })
        //.catch(showHttpError);    
}

function cleanSolve() {
        
}


function showSolution(scenario) {
        showAsGoogleTables(scenario, 'outputs_div', 'output', undefined, scenariocfg)        

        colors = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
  
        rows = scenario.tables['production'].rows;
        values = {}

        periods = []
        for (o in rows) {
                p = rows[o].Periods;
                x = periods.indexOf(p);
                if (x == -1) {
                        periods.push(p);
                        x = periods.indexOf(p);
                }
                y = parseFloat(rows[o].value);
                unit = rows[o].Units;                
                if (!(unit in values))
                        values[unit] = [];
                values[unit].push({x:x, y:y});
        }
        data = []
        units = []  

        for (u in values) {
                units.push(u);
                unitsidx = units.indexOf(u);
                d = {
                        values:values[u],
                        key:u,
                        color: colors[unitsidx]
                };
                data.push(d)
        }


        nv.addGraph(function() {
                var chart = nv.models.stackedAreaChart()
                        .margin({right: 100})
                       // .x(function(d) { return d[0] })   //We can modify the data accessor functions...
                       // .y(function(d) { return d[1] })   //...in case your data is formatted differently.
                        .useInteractiveGuideline(true)    //Tooltips which show all data points. Very nice!
                        .rightAlignYAxis(true)      //Let's move the y-axis to the right side.
                        //.transitionDuration(500)
                        .showControls(true)       //Allow user to choose 'Stacked', 'Stream', 'Expanded' mode.
                        .clipEdge(true);
        
                //Format x-axis labels with custom function.
                // chart.xAxis
                // .tickFormat(function(d) { 
                // return d3.time.format('%x')(new Date(d)) 
                // });
        
                chart.yAxis
                .tickFormat(d3.format(',.2f'));
        
                d3.select('#chart svg')
                .datum(data)
                .call(chart);
        
                nv.utils.windowResize(chart.update);
        
                return chart;
        });
}

function showKpis(scenario) {
        if (scenario != scenariomgr.getSelectedScenario())
                return;                

        showKPIsAsGoogleTable(scenariomgr, 'kpis_div');
}