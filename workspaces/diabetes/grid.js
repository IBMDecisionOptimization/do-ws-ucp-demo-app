// <script src="https://d3js.org/d3.v4.min.js"></script>


scenariogrid.addScenarioWidget(onChangeScenario, 0, 0, 2, 2);
        
scenariogrid.addScoreWidget(0, 2, 2, 2);

scenariogrid.addPAWidget(0, 4);

function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }
function getArea(what, val) {
        let m = 10 * Math.trunc(val /10);
        return what + '[' + pad(m,3) + "-" + pad(m+9,3) + ']';
}
let plants = []
function getInType(plant) {
        let idx = plants.indexOf(plant);
        if (idx < 0)
                plants.push(plant)
        return plants.indexOf(plant);
}

let products = []
function getOutType(product) {
        let idx = products.indexOf(product);
        if (idx < 0)
                products.push(product)
        return products.indexOf(product);
}

function sankeycb(what) {
        
    
    let scenario = scenariomgr.getSelectedScenario();

    // SANKEY

    color = d3.scale.category20();

    //set up graph in same style as original example but empty
    graph = {"nodes" : [], "links" : []};

    let flows = {};

    let inputs = scenario.getTableRows('Diabetes');
    let outcomes = scenario.getTableRows('DiabetesOutcome');
    for (l in inputs) {
        let input = inputs[l];
        let outcome = outcomes[l];
        let fromNode = getArea(what, input[what]);
        let toNode = outcome.value; 
        if (fromNode in flows) {
                if (toNode in flows[fromNode])
                        flows[fromNode][toNode] = flows[fromNode][toNode] + 1;
                else
                        flows[fromNode][toNode] =  1;
        } else {
                flows[fromNode] = {};
                flows[fromNode][toNode] = 1;
        }
    }

    indexes = {};

    for (fromNode in flows) {
            for (toNode in flows[fromNode]) {
                let flow = flows[fromNode][toNode];
                let idxFromNode = indexes[fromNode];
                if (idxFromNode == undefined) { 
                        idxFromNode = Object.keys(indexes).length;
                        indexes[fromNode] = idxFromNode;
                        graph.nodes.push({ "node":idxFromNode, 
                                        "name": fromNode,
                                        "color": color(getInType(fromNode)),
                                        "title":  fromNode,
                                        "tooltip":  what + ": " + fromNode
                                        });
                }

                let idxToNode = indexes[toNode];
                if (idxToNode == undefined) { 
                        idxToNode = Object.keys(indexes).length;
                        indexes[toNode] = idxToNode;
                        graph.nodes.push({ "node":idxToNode, 
                                        "name": toNode,
                                        "color": color(getOutType(toNode)),
                                        "title":  toNode,
                                        "tooltip":  "Diabetes: " + toNode
                                        });
                }
                graph.links.push({ "source": idxFromNode,
                                        "target": idxToNode,
                                        "value": flow,
                                        "color" : color(getInType(toNode)),
                                        "tooltip" :   what + ": " + fromNode + " to Diabetes: " + toNode + " : " + flow 
                                        });
        }
    };

    let div = document.getElementById('sankey_'+what+'_div');

    let vw = div.parentNode.clientWidth-50;
    let vh = div.parentNode.clientHeight-50;

    d3sankey('sankey_'+what+'_div', graph, {top: 10, right: 10, bottom: 10, left: 10, width:vw, height: vh});

}



let sankeyagecfg = { 
    x: 2,
    y: 0,
    width: 5,
    height: 6,
    title: "Diabetes per Age",
    innerHTML: '<div id="sankey_Age_div" style="width:100%; height: calc(100% - 30px);"></div>',
    cb: function () {sankeycb('Age');}
}

scenariogrid.addCustomWidget('sankeyage',  sankeyagecfg);


let sankeyglucosecfg = { 
        x: 7,
        y: 0,
        width: 5,
        height: 6,
        title: "Diabetes per Glucose",
        innerHTML: '<div id="sankey_Glucose_div" style="width:100%; height: calc(100% - 30px);"></div>',
        cb: function () {sankeycb('Glucose');}
    }
    
scenariogrid.addCustomWidget('sankeyglucose',  sankeyglucosecfg);
    

    
scenariogrid.addTablesWidget('Inputs', 'input', undefined, 0, 6, 6, 4);

scenariogrid.addTablesWidget('Outputs', 'output', undefined, 6, 6, 6, 4);


function heatmapinputcb() {
        let scenario = scenariomgr.getSelectedScenario();
        
        let data1 = {}
        let inputs = scenario.getTableRows('Diabetes');
        let outcomes = scenario.getTableRows('DiabetesOutcome');
        for (l in inputs) {
                let input = inputs[l];
                let outcome = 1;

                let x = getArea('Glucose', input.Glucose);
                let y = getArea('Age', input.Age);

                if (x in data1) {
                        if (y in data1[x])
                                data1[x][y] = data1[x][y] + outcome;
                        else
                                data1[x][y] =  outcome;
                } else {
                        data1[x] = {};
                        data1[x][y] = outcome;
                }
        }
        let data = []
        for (x in data1)
                for (y in data1[x])
                        data.push({
                                x:x, 
                                y:y, 
                                value:data1[x][y],
                                tooltip: x + '-' + y + ': ' + data1[x][y]
                        });

        let div = document.getElementById('heatmap_input_div');

        let config = {
                width: div.parentNode.clientWidth-30,
                height: div.parentNode.clientHeight-30,
                top: 120, right: 20, bottom: 20, left: 110
                }
        d3heatmap('heatmap_input_div', data, config)
}


let heatmapinputcfg = { 
        x: 0,
        y: 10,
        width: 6,
        height: 5,
        title: "Input data",
        innerHTML: '<div id="heatmap_input_div" style="width:100%; height: calc(100% - 30px);"></div>',
        cb: function () {heatmapinputcb();}
    }
    
scenariogrid.addCustomWidget('heatmap_input',  heatmapinputcfg);
    


function heatmapoutputcb() {
        let scenario = scenariomgr.getSelectedScenario();
        
        let data1 = {}
        let inputs = scenario.getTableRows('Diabetes');
        let outcomes = scenario.getTableRows('DiabetesOutcome');
        for (l in inputs) {
                let input = inputs[l];
                let outcome = parseInt(outcomes[l].value);

                let x = getArea('Glucose', input.Glucose);
                let y = getArea('Age', input.Age);

                if (x in data1) {
                        if (y in data1[x])
                                data1[x][y] = data1[x][y] + outcome;
                        else
                                data1[x][y] =  outcome;
                } else {
                        data1[x] = {};
                        data1[x][y] = outcome;
                }
        }
        let data = []
        for (x in data1)
                for (y in data1[x])
                        data.push({
                                x:x, 
                                y:y, 
                                value:data1[x][y],
                                tooltip: x + '-' + y + ': ' + data1[x][y]
                        });

        let div = document.getElementById('heatmap_output_div');

        let config = {
                width: div.parentNode.clientWidth-30,
                height: div.parentNode.clientHeight-30,
                top: 120, right: 20, bottom: 20, left: 110
                }
        d3heatmap('heatmap_output_div', data, config)
}


let heatmapoutputcfg = { 
        x: 6,
        y: 10,
        width: 6,
        height: 5,
        title: "Output data",
        innerHTML: '<div id="heatmap_output_div" style="width:100%; height: calc(100% - 30px);"></div>',
        cb: function () {heatmapoutputcb();}
    }
    
scenariogrid.addCustomWidget('heatmap_output',  heatmapoutputcfg);
    