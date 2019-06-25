

function isArray (value) {
        return value && typeof value === 'object' && value.constructor === Array;
}

function load_scenario(scenario, inputjson, category ='input') {
        for (let tableId in inputjson) {
                let obj = inputjson[tableId];
                if (tableId in scenario.tables)
                        tableId = '_'+tableId;
                if (isArray (obj)) {
                        let rows = obj
                        if (rows.length == 0) {
                                console.log('MOS READ PROBLEM ' +tableId);
                                continue;
                        }
                        let cols = [];
                        for (let col in rows[0])
                                cols.push(col)
                        scenario.addTable(tableId, category, cols, {});
                        for (let rowId in rows)
                                scenario.addRowToTable(tableId, rowId, rows[rowId])
                } else if (typeof obj === 'object') {
                        console.log('MOS READ PROBLEM ' +tableId);
                        scenario.addTable(tableId, category, ['name', 'value'], {});
                        for (let elt in obj)
                                scenario.addRowToTable(tableId, elt, {name:elt, value:obj[elt]})
                } else {
                        console.log('MOS READ PROBLEM ' +tableId);
                }
        }
}
        
function importCB() {        
        let scenario = scenariomgr.newScenario('imported');
        let url = './api/config/file?fileName=test-craft-RES-5-OPASCPSinput-82.json';
        
        if (workspace != undefined)
                url += '&workspace='+workspace;
        axios({
                method:'get',
                url:url,
                responseType:'text/plain'
        })
        .then(function (response) {
                
                let inputjson = response.data;
                load_scenario(scenario, inputjson);
                scenario.mgr.saveScenario(scenario);
                scenariogrid.redraw();

                url = './api/config/file?fileName=test-craft-RES-5_output.json';
                if (workspace != undefined)
                        url += '&workspace='+workspace;
                axios({
                        method:'get',
                        url:url,
                        responseType:'text/plain'
                })
                .then(function (response) {
                        let inputjson = response.data;
                        load_scenario(scenario, inputjson, 'output');
                        scenario.mgr.saveScenario(scenario);
                        scenariogrid.redraw();
                }); 
        }); 
        
}
scenariogrid.addActionWidget('import', 'Import', importCB, 0, 0, 2, 2);


  
function ganttcb() {
        let scenario = scenariomgr.getSelectedScenario();

        assignments_data = undefined;
        
        if (scenario.contains('_workOrders') ) {
                activities = {}
                resources = {};

                resources['Main'] = {
                        "id" : 'Main',
                        "name" : 'Main',
                        "activities" : [],
                        "parent" : ""
                }

                //initTime = new Date().getTime();
                initTime = 0;
                stepms = 86400*10*10; // day
                //stepms = 60*1000; // min
                acts = scenario.getTableRows('workOrders');
                rows = scenario.getTableRows('_workOrders');
                for (var r in rows) {
                        row = rows[r]
                        taskId  = row['id'];
                        //resourceId  = row['unitName'];
                        start = Date.parse(row['solutionStartTime']);
                        end = Date.parse(row['solutionEndTime']);
                        
                        activity = {
                                "id" : taskId,
                                "name": taskId,
                                "start" : start,
                                "end" : end
                        }
                        activities[taskId] = activity;

                        let resourceId = taskId;
                        let parent = acts[taskId]['parentid'];
                        // if ( != '')  {
                        //         resourceId = acts[taskId]['parentid'];
                        //         parent = 'parentid';
                        // }

                        if (resourceId in resources)
                                resources[resourceId].activities.push(activity);
                        else
                                resources[resourceId] = {
                                        "id" : resourceId,
                                        "name" : resourceId,
                                        "activities" : [activity],
                                        "parent" : parent
                                }

                        if (!(parent in resources)) {
                                resources[parent] = {
                                        "id" : parent,
                                        "name" : parent,
                                        "activities" : [],
                                        "parent" : 'Main'
                                }
                        }
                }

                assignments_data = []
                for (res in resources) {
                        assignments_data.push(resources[res]);
                }

        } 

        document.getElementById('gantt_div').innerHTML = "";

        if (assignments_data != undefined) {

                var config = {
                        data : {
                                // Configures how to fetch resources for the Gantt
                                resources : {
                                        data : assignments_data, // resources are provided in an array. Instead, we could configure a request to the server.
                                        // Activities of the resources are provided along with the 'activities' property of resource objects.
                                        // Alternatively, they could be listed from the 'data.activities' configuration.
                                        activities : "activities",
                                        name : "name", // The name of the resource is provided with the name property of the resource object.
                                        id : 'id', // The id of the resource is provided with the id property of the resource object.
                                        parent : 'parent'
                                },
                                // Configures how to fetch activities for the Gantt
                                // As activities are provided along with the resources, this section only describes how to create
                                // activity Gantt properties from the activity model objects.
                                activities : {
                                        start : 'start', // The start of the activity is provided with the start property of the model object
                                        end : 'end', // The end of the activity is provided with the end property of the model object
                                        name : 'name' // The name of the activity is provided with the name property of the model object
                                }
                        },
                        // Configure a toolbar associated with the Gantt
                        toolbar : [
                                'title',
                                'search',
                                'separator',
                                {
                                        type: 'button',
                                        text: 'Refresh',
                                        fontIcon : 'fa fa-refresh fa-lg',
                                        onclick: function (ctx) {
                                        ctx.gantt.draw();
                                        }
                                },                                
                                'mini',
                                'fitToContent',
                                'zoomIn',
                                'zoomOut',
                                'toggleLoadChart'
                        ],
                        loadResourceChart : {

                                load :  function(res, act) { 
                                                return 1; 
                                        },
                                height: '150px'
                        }, 
                        timeTable : {
                                renderer : [{
                                        selector : function(object, ctx) {
                                        return true;
                                        },
                                        
                                        tooltipProperties : function(activity, ctx) {
                                                var props = [ 'Start', new Date(activity.start).format(), 'End', new Date(activity.end).format()];
                                                props.push('Name', activity.name);                                                
                                                return props;
                                        }
                                }]
                                },
                        title : 'Schedule' // Title for the Gantt to be displayed in the toolbar
                };
                gdiv = document.getElementById('gantt_div');
                var myDiv = document.createElement('div');
                myDiv.style = "height:100%"
                myDiv.id  = 'my_gantt_div';
                gdiv.appendChild(myDiv);
                gantt = new Gantt('my_gantt_div' /* the id of the DOM element to contain the Gantt chart */, config);
                
        }
}


let ganttcfg = { 
        x: 2,
        y: 0,
        width: 10,
        height: 7,
        title: "Gantt chart",
        innerHTML: '<div id="gantt_div" style="width:100%; height: calc(100% - 30px);"></div>',
        cb: ganttcb
}


scenariogrid.addCustomWidget('gantt', ganttcfg);