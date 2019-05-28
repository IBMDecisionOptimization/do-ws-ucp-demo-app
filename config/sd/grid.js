
scenariogrid.addScenarioWidget(onChangeScenario, 0, 0, 2, 3);

scenariogrid.addKPIsWidget(0, 6, 12, 5);


scenariogrid.addSolveWidget(0, 3);

scenariogrid.addTablesWidget('Inputs', 'input', undefined, 0, 8, 6, 4);

scenariogrid.addTablesWidget('Outputs', 'output', undefined, 6, 8, 6, 4);

let plants = []
function getPlantType(plant) {
        let idx = plants.indexOf(plant);
        if (idx < 0)
                plants.push(plant)
        return plants.indexOf(plant);
}

let products = []
function getProductType(product) {
        let idx = products.indexOf(product);
        if (idx < 0)
                products.push(product)
        return products.indexOf(product);
}

function sankeycb() {
        
    let scenario = scenariomgr.getSelectedScenario();

    // SANKEY

    // format variables
    var formatNumber = d3.format(",.0f"),    // zero decimal places
    format = function(d) { return formatNumber(d) + " hm3"; },
    // color = d3.scaleOrdinal(d3.schemeCategory20);
    color = d3.scale.category20();

    //set up graph in same style as original example but empty
    graph = {"nodes" : [], "links" : []};

    let flows = {};

    let productions = scenario.getTableRows('production');
    for (l in productions) {
        let production = productions[l];
        let flow = Math.trunc(production.value);
        let fromNode = production.Plants;
        let toNode = production.Months; // errorin data
        if (fromNode in flows) {
                if (toNode in flows[fromNode])
                        flows[fromNode][toNode] = flows[fromNode][toNode] + flow;
                else
                        flows[fromNode][toNode] =  flow;
        } else {
                flows[fromNode] = {};
                flows[fromNode][toNode] = flow;
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
                                        "color": color(getPlantType(fromNode)),
                                        "title":  fromNode,
                                        "tooltip":  "Plant: " + fromNode
                                        });
                }

                let idxToNode = indexes[toNode];
                if (idxToNode == undefined) { 
                        idxToNode = Object.keys(indexes).length;
                        indexes[toNode] = idxToNode;
                        graph.nodes.push({ "node":idxToNode, 
                                        "name": toNode,
                                        "color": color(getProductType(toNode)),
                                        "title":  toNode,
                                        "tooltip":  "Product: " + toNode
                                        });
                }
                graph.links.push({ "source": idxFromNode,
                                        "target": idxToNode,
                                        "value": flow,
                                        //"nbOperations" : link.nbOperations,
                                        "color" : color(getProductType(toNode)),
                                        "tooltip" :   "Plant: " + fromNode + " to Product: " + toNode + " : " + flow 
                                        });
        }
    };

    let div = document.getElementById('sankey_div');

    let vw = div.parentNode.clientWidth-50;
    let vh = div.parentNode.clientHeight-50;

    d3sankey("sankey_div", graph, {top: 10, right: 10, bottom: 10, left: 10, width:vw  , height: vh});

}



let sankeycfg = { 
    x: 2,
    y: 0,
    width: 10,
    height: 6,
    title: "Production chart",
    innerHTML: '<div id="sankey_div" style="width:100%; height: calc(100% - 30px);"></div>',
    cb: sankeycb
}

scenariogrid.addCustomWidget('sankey', sankeycfg);


             


function treecb() {


        let scenario = scenariomgr.getSelectedScenario();

        let div = document.getElementById('tree_div');

        div.innerHTML = "";

        let flows = {};

        let productions = scenario.getTableRows('production');
        for (l in productions) {
                let production = productions[l];
                let flow = Math.trunc(production.value);
                let fromNode = production.Plants;
                let toNode = production.Months; // errorin data
                if (fromNode in flows) {
                        if (toNode in flows[fromNode])
                                flows[fromNode][toNode] = flows[fromNode][toNode] + flow;
                        else
                                flows[fromNode][toNode] =  flow;
                } else {
                        flows[fromNode] = {};
                        flows[fromNode][toNode] = flow;
                }

        }

        data = {name: "production", children : []}
        for (fromNode in flows) {
                let children = {name:fromNode, children:[]}
                for (toNode in flows[fromNode]) {
                        let gchildren = {name:toNode, value:flows[fromNode][toNode]}
                        children.children.push(gchildren)
                }
                data.children.push(children)
        }        

        let w = div.parentNode.clientWidth-50;
        let h = div.parentNode.clientHeight-50;

        var x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]),
        color = d3.scale.category20c(),
        root,
        node;

        var treemap = d3.layout.treemap()
        .round(false)
        .size([w, h])
        .sticky(true)
        //    .value(function(d) { return d["好き度"]; });
        .value(function(d) { return d.value; });

        var svg = d3.select("#tree_div").append("div")
        .attr("class", "chart")
        .style("width", w + "px")
        .style("height", h + "px")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .append("svg:g")
        .attr("transform", "translate(.5,.5)");


        node = root = data;
        console.log(data);
        var nodes = treemap.nodes(root)
        .filter(function(d) {return !d.children; });

        var cell = svg.selectAll("g")
        .data(nodes)
        .enter().append("svg:g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

        cell.append("svg:rect")
        .attr("width", function(d) { return Math.max(0, d.dx - 1); })
        .attr("height", function(d) { return Math.max(0, d.dy - 1); })
        .style("fill", function(d) {
                return color(d.parent.name); 
        });

        cell.append("svg:text")
        .attr("x", function(d) { return d.dx / 2; })
        .attr("y", function(d) { return d.dy / 2; })
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; })
        .style("opacity", function(d) { d.w = this.getComputedTextLength(); return d.dx > d.w ? 1 : 0; });

        var tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("display", "none")
        .style("width", "auto")
        .style("height", "auto")
        .style("background", "none repeat scroll 0 0 white")
        .style("border", "0 none")
        .style("border-radius", "8px 8px 8px 8px")
        .style("box-shadow", "-3px 3px 15px #888888")
        .style("color", "black")
        .style("font", "12px sans-serif")
        .style("padding", "5px")

        cell
        .on("mouseover", function(){return tooltip.style("display", "inline-block");})
        .on("mousemove", function(d){ tooltip.style("left", d3.event.pageX + 10 + "px")
                tooltip.style("top", d3.event.pageY - 20 + "px")
                tooltip.style("display", "inline-block")
                tooltip.html(d.parent.name +" produces " + d.value + " units of " + d.name + "<br>")})

        .on("mouseout", function(){return tooltip.style("display", "none");});


        d3.select(window).on("click", function() { zoom(root); });

        function zoom(d) {
                var kx = w / d.dx, ky = h / d.dy;
                x.domain([d.x, d.x + d.dx]);
                y.domain([d.y, d.y + d.dy]);

                var t = svg.selectAll("g.cell").transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

                t.select("rect")
                .attr("width", function(d) { return kx * d.dx - 1; })
                .attr("height", function(d) { return ky * d.dy - 1; })

                if (d == root)
                        t.select("rect")
                        .style("fill", function(d) {
                                return color(d.parent.name); 
                        });
                else
                        t.select("rect")
                        .style("fill", function(d) {
                                return color(d.name); 
                        });

                t.select("text")
                .attr("x", function(d) { return kx * d.dx / 2; })
                .attr("y", function(d) { return ky * d.dy / 2; })
                .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

                node = d;
                d3.event.stopPropagation();
        }
}




let treecfg = { 
        x: 2,
        y: 0,
        width: 10,
        height: 6,
        title: "Production TreeMap",
        innerHTML: '<div id="tree_div" style="width:100%; height: calc(100% - 30px);"></div>',
        cb: treecb
}
        
scenariogrid.addCustomWidget('tree', treecfg);