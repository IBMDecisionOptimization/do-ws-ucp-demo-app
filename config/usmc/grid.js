
//[ 'red', 'blue', 'light green', 'purple', 'orange', 'dark green' ],
commands = {
        "NORTHCOM": {index : 1, color: 0},
        "CENTCOM" : {index : 2, color: 1},
        "CENTCOM-WC" : {index : 3, color: 1},
        "CENTCOM-EC" : {index : 4, color: 1},
        "AFRICOM": {index : 5, color: 2},
        "PACOM": {index : 6, color: 3},
        "SOUTHCOM": {index : 7, color: 4},
        "EUCOM": {index : 7, color: 5}
}


function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }


function ganttcb() {
        let scenario = scenariomgr.getSelectedScenario();

        assignments_data = undefined;
        
        if (scenario.contains('updatedSchedule') ) {
                activities = {}
                resources = {};

                //initTime = new Date().getTime();
                initTime = 0;
                stepms = 86400*10*10; // day
                //stepms = 60*1000; // min
                rows = scenario.getTableRows('updatedSchedule');
                for (var r in rows) {
                        row = rows[r]
                        unitId  = row['unitCode'];
                        unitName  = row['unitName'];
                        reqName  = row['reqName'];
                        start = new Date(row['startDate']);
                        end = new Date(row['endDate']);
                        command = row['command'];
                        commandcolor = commands[command].color

                        
                        activity = {
                                "id" : reqName,
                                "name": reqName,
                                "start" : start.getTime(),
                                "end" : end.getTime(),
                                "command" : command,
                                "commandcolor" : commandcolor
                        }
                        activities[reqName] = activity;

                        taskForce = row['taskForce']
                        if (!(taskForce in resources))
                                resources[taskForce] = {
                                        "id" : taskForce,
                                        "name" : taskForce,
                                        "activities" : [],
                                        "parent" : ""
                                }

                        if (unitId in resources)
                                resources[unitId].activities.push(activity);
                        else
                                resources[unitId] = {
                                        "id" : unitId,
                                        "name" : unitName,
                                        "activities" : [activity],
                                        "parent" : taskForce
                                }
                }

                assignments_data = []
                for (res in resources) {
                        assignments_data.push(resources[res]);
                }

        } 

        document.getElementById('gantt_div').innerHTML = "";

        if (assignments_data != undefined) {
                commandfilteroptions = [{ value: "none", text: "None" }];
                for (c in commands) 
                        commandfilteroptions.push({value:commands[c].index, text: c});

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
                                        name : 'name', // The name of the activity is provided with the name property of the model object
                                        command : 'command',
                                        commandcolor : 'commandcolor'
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
                                {
                                        type: 'select',
                                        text: 'Filter on Command',
                                        options : commandfilteroptions,
                                        onchange : function(command, ctx) {
                                            var gantt = ctx.gantt;
                                            if (gantt.commandFilter) {
                                                gantt.removeFilter(gantt.commandFilter);
                                            }
                                            if (command && ("none" !== command)) {
                                                gantt.commandFilter = gantt.addFilter(function(obj) {
                                                    return obj.command && commands[obj.command].index == command;
                                                }, true /* filter rows */, true /* filter activities */);
                                            }
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
                                        background : {
                                                palette : [ '#ff0000', '#0000ff', '#90ee90', '#800080', '#ffa500', '#006400' ],
                                                values : [0, 1, 2, 3, 4, 5],
                                                getValue : 'commandcolor'
                                        },
                                        color : 'automatic',
                                        tooltipProperties : function(activity, ctx) {
                                                var props = [ 'Start', new Date(activity.start).format(), 'End', new Date(activity.end).format()];
                                                props.push('Name', activity.name);                                                
                                                props.push('Command', activity.command);          
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

function summarycb() {
        let scenario = scenariomgr.getSelectedScenario();

        scheds = scenario.getTableRows('updatedSchedule');
        assigns = scenario.getTableRows('assignmentStats');
        summary = {}
        cols = ['unit', 'assignments', 'dwellratio', 'dwelltime']
        scenario.addTable("summary", "output", cols, scenariocfg['summary'])
        for (a in assigns) {
                let assign = assigns[a]
                let row = {}
                row.unit = assign.unitCode;
                na = 0;
                for (s in scheds) {
                        sched = scheds[s]
                        if (sched.unitCode == row.unit)
                                na++;
                }
                row.assignments = String(na);
                row.dwellratio = String(assign.dwellTR);
                row.dwelltime = String(assign.dwellTD);
                scenario.addRowToTable('summary', row.unit, row);
        }
        let config = {title: 'Summary', sortAscending: true, sortColumn: 0, showRowNumber: false, width: '100%', height: '100%'};
        showAsGoogleTable(scenario, 'summary', 'summary_div', config)
}

scenariogrid.addScenarioWidget(onChangeScenario, 0, 0, 2, 2);

scenariogrid.addSolveWidget(0, 2, 2, 2);

let ganttcfg = { 
		x: 0,
		y: 22,
		width: 12,
		height: 6,
		title: "Gantt chart",
		innerHTML: '<div id="gantt_div" style="width:100%; height: calc(100% - 30px);"></div>',
		cb: ganttcb
}

scenariogrid.addCustomWidget('gantt', ganttcfg);


scenariogrid.addTablesWidget('Inputs', 'input', ['requirements', 'units', 'currentSchedule', 'assignmentCompatibilityRules', 'unitTypes','taskForces', 'mttr', 'excludedDeployment','fixedDeployment'],  0,0, 12, 6);

scenariogrid.addTablesWidget('Outputs', 'output', ['updatedSchedule', 'assignmentStats'],  0, 0, 12, 6);

scenariogrid.addKPIsWidget(2, 0, 12, 5);



//scenariogrid.addTableWidget('Weights', scenariocfg.Weights, 0, 0, 6, 3);

scenariogrid.addTableWidget('kpis', scenariocfg.kpis, 6, 0, 12, 3);




let summarycfg = { 
		x: 0,
		y: 22,
		width: 12,
		height: 6,
		title: "Summary",
		innerHTML: '<div id="summary_div" style="width:100%; height: calc(100% - 30px);"></div>',
		cb: summarycb
}
scenariogrid.addCustomWidget('summary', summarycfg);