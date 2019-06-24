
function load() {               

        axios({
                method:'get',
                url:'../api/configs',
                responseType:'json'
              })
        .then(function (response) {
                let configs = response.data;

                console.log("Configs:");
                console.log(configs);

                function makeDiv(what, color) {
                        let div = document.createElement("div");
                        div.style.background=color;
                        div.style.width="50%";
                        div.style.margin="5px";
                        div.style.padding="5px";
                        div.innerHTML = what;
                        return div;
                }
                let wdiv = document.getElementById('workspaces_div');
                for (let workspace in configs) {
                        if (workspace == 'default' )
                                continue;
                        let config = configs[workspace]; 
                        let div = document.createElement("div"); 
                        div.style.width = '100%';
                        let dl = document.createElement("div"); 
                        let html = "<h2>" + config.name + '</h2>';
                        html += config.description + '<br>';

                        
                        html += '<a href="../?workspace=' + workspace + '"><b>Go to ' + workspace + '</b></a/'; 
                        dl.innerHTML = html;
                        dl.style.float = 'left';
                        dl.style.width = '20%';
                        dl.style.padding = '10px';

                        
                        if ('ml' in config)
                                dl.append(makeDiv('Machine Learning', '#f24b4b'));
                        if ('pa' in config)
                                dl.append(makeDiv('Planning Analytics', '#44ce1a'));
                        if ('dsx' in config)
                                dl.append(makeDiv('Watson Studio', '#8995ed'));
                        if ('do' in config) {
                                let text = 'Decision Optimization';
                                if ('type' in config.do)
                                        text += ' (' + config.do.type +')';
                                else if ('model' in config.do)
                                        text += ' (DO CPLEX CLOUD)';
                                else text += ' (MMD)';
                                dl.append(makeDiv(text, 'orange'));
                        }
                        if ('ma' in config)
                                dl.append(makeDiv('Modeling Assistant', 'pink'));
                                
                        div.append(dl);
                        let dr = document.createElement("div"); 
                         html = '<iframe src="../?workspace=' + workspace +'" width="100%" height="400">';
                        html += 'Preview of ' + config.name;
                        html += '</iframe>';
                        dr.innerHTML = html;
                        dr.style.float = 'right';
                        dr.style.width = '80%';
                        div.append(dr);
                        let dc = document.createElement("div"); 
                        dc.style.clear = 'both';
                        div.append(dc);
                        wdiv.append(div);
                        let br = document.createElement('br');
                        wdiv.append(br);
                }

        });

};

