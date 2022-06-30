const ResourceActions= require ('../config/actions.json')
const json2html = require('node-json2html');
const fs = require('fs');

function parseResourceName(resourceStr) {
    let resourceTokens = resourceStr.split(":");
    let [name, id] = resourceTokens[resourceTokens.length - 1].split("/");
    return name;
}

/**
 * 
 * @param {*} resourceString 
 * @returns  {actions:{ createProject:'', deleteProject:'',...}, resourceName:"proj"}
 */
function getResourceActions(resourceString){
    
    let resourceName  = ((str)=>{
        let strTmp = (str.charAt(0) == '!')? str.replace('!', ''):str;
        return str.includes("/")?parseResourceName(strTmp): strTmp;
    } )(resourceString);
    let actions = ResourceActions[resourceName];

    if(!actions){
        throw new Error(`Unknown Resource, for resource specifier [${resourceString}]. Check if Resource is in actions.json`);
    }

    return {actions, resourceName};
}

function createWildCardResourceRegex(str){
    let isNotResources= (str.charAt(0)==='!');
    str= str.replace('!','').trim();
    let resourceTokens = str.split(":");
    let resourceStr = resourceTokens.reduce((acc, curr, idx) => {
        let rt = curr.split("/");
        let tags = rt[1].split(";");

        acc += `${rt[0]}/*` +
            ((tags.length > 1) ? `;${tags[1]}` : '') +
            ((idx < resourceTokens.length - 1) ? ":" : "");
        return acc.trim();
    }, "");

    return resourceStr;
}
// proj/*:env/* --> 'proj\/.*(;.*)*:env\/.*(;|,+)(?!.*:).*'
// proj/*   --->'proj\/(?!.*:).*';
function createRegex(str) {
    
    let sections  = ((str)=>{
        let strTmp = (str.charAt(0) == '!')? str.replace('!', ''):str;
        return strTmp.split(":");
    } )(str);

    let resourceStmnt = [];
    for (let i = 0; i < sections.length; i++) {
        
        let section = sections[i];
        let [resource, tags] = section.split(";");
        resource= resource.trim();
        let regexStr = resource.replace('/', '\\/');
        
        if (i < sections.length-1) {
            regexStr = (i < sections.length) ? regexStr.replace('*', '.*(;.*)*') :
                regexStr.replace("*", '.*(;|,+)');

        } else {

            if (regexStr.charAt(regexStr.length - 1) == '*') {
                regexStr = regexStr.replace('*', '(?!.*:).*');
            } else {
                regexStr = regexStr.replace('*', '.*') + '(?!.*:).*';
            }

        }
        if (tags && tags.length > 0) {
            let tokens = tags.split(",");
            let tmpStr = tokens.reduce((acc, curr) => acc + `(?=.*${curr})`, '')
            regexStr += `;(${tmpStr}.+)`;
        }
        resourceStmnt.push(regexStr);
    }

    return resourceStmnt.reduce((acc, curr) => acc + (acc.length > 0 ? `:${curr}` : curr));
}
function mergeAllowDenyDetails(detail1, detail2){
    let detail1Keys = Object.keys (detail1);
    let detail2Keys = Object.keys (detail2);
    let tmp={};
    for (let key of detail1Keys){
        tmp[key] = [...detail1[key], ...detail2Keys.includes(key)?detail2[key]:[]];
        tmp[key]= [...new Set(tmp[key])];
    }

    for (let key of detail2Keys){
        tmp[key] = [...detail2[key], ...detail1Keys.includes(key)?detail1[key]:[]];
        tmp[key]= [...new Set(tmp[key])];
    }

    return tmp;
  }
  function mergeAllowDenyActions(detail1, detail2){
    let tmp =[...detail1, ...detail2];
    return [...new Set(tmp)];
  }

function deepCopy( sourceObj ){
    return JSON.parse(JSON.stringify(sourceObj));
}
function convJson2Html(jsonData){
    let data = [];
    for (let resourceName in jsonData) {
        let {
            allow,
            allowDetails,
            deny,
            denyDetails,
            type
        } = jsonData[resourceName];


        let allowInfo = allow.map(action => ({
                id: action,
                description: ResourceActions[type][action],
                resourceName,
                source: allowDetails[action]
        }));

        let denyInfo = deny.map(action => ({
                id: action,
                description: ResourceActions[type][action],
                resourceName,
                source: denyDetails[action]
        }));
        if (resourceName.charAt(0)=='!'){
            resourceName= resourceName.replace('!',' [notResources] ');
        }
        data.push({
            resourceName,
            type: type.toUpperCase(),
            allow: allowInfo,
            deny: denyInfo
        });
    }
    
    let template = [{
            '<>': 'div',
            'html': [{
                '<>': 'table',
                'html': [{
                    '<>': 'thead',
                    'html': [{
                        '<>': 'th',
                        'class':'resource-string',
                        'colspan': '3',
                        'text': '[${type}]   ${resourceName}'
                    }]
                }, {
                    '<>': 'tbody',
                    'html': [
                        {
                            '<>': 'tr',
                            'class': 'allow',
                            'html': [{
                                '<>': 'td',
                                'data-resource-string':'${resourceName}',
                                'data-action': '${id}',
                                'data-source': '${source}',
                                 'html': [{
                                     '<>': 'div',
                                     'class': 'action_content',
                                     'text': '${id}'
                                 }]
                            }, {
                                '<>': 'td',
                                'text': '${description}'
                            }, {
                                '<>': 'td',
                                'text': '${source}'
                            }],
                            '{}': function () {
                                return this.allow
                            }
                        },
                        {
                            '<>': 'tr',
                            'class':'deny',
                            'html': [{
                                    '<>': 'td',
                                    'data-resource-string': '${resourceName}',
                                    'data-action': '${id}',
                                    'data-source': '${source}',
                                    'html': [{
                                        '<>': 'div',
                                        'class': 'action_content',
                                        'text': '${id}'
                                    }]
                                }, {
                                '<>': 'td',
                                'text': '${description}'
                            }, {
                                '<>': 'td',
                                'text': '${source}'
                            }],
                            '{}': function () {
                                return this.deny
                            }
                        }
                    ]
                }]
            }]
        }
    ];
    // console.log(JSON.stringify(data,null,2))
    return json2html.render(data, template); 
}
function convHTMLReport(jsonData, graphData, policyFileName="", mergedFilesDetails) {
    let htmlStr = convJson2Html(jsonData);
    return `
        <html>
            <head>
            
                <link rel = "stylesheet" href = "../styles/styles.css" />
                <script type="text/javascript">
                    const MergedFilesDetails=${JSON.stringify(mergedFilesDetails,null, 2)}
                </script>
                <script type="text/javascript" src="../lib/validator.js"> </script>
                    <script type = "text/javascript" src = "https://www.gstatic.com/charts/loader.js"> </script> 
                    <script type = "text/javascript"> 

                        let gChart, gData;
                        let colors = ['#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f',  '#cab2d6', '#ffff99', '#1f78b4', '#33a02c' ];
                        let options = {
                            height: 400,
                            sankey: {
                                node: {
                                    nodePadding:25,
                                    colors: colors,
                                    interactivity: true,
                                    label: { 
                                        fontSize: 14,
                                        bold: true
                                    },
                                    labelPadding: 30

                                },
                                link: {
                                    interactivity: true,
                                    strokeWidth: 2,
                                    colorMode: 'gradient',
                                    colors: colors
                                }
                            }
                            };

                        google.charts.load('current', {'packages': ['sankey']});
                        google.charts.setOnLoadCallback(drawChart);
                        window.addEventListener('ready', drawChart);
                        window.addEventListener('resize', drawChart);
                        window.addEventListener('DOMContentLoaded', addNodeClickHandler);

                        
                        function parseData(data) {
                            let parsedData = [];
                            for (let resourceName of Object.keys(data)) {
                                if (data[resourceName].length == 0) {
                                    continue;
                                }
                                for (let child of data[resourceName]) {
                                    parsedData.push([resourceName, child, 1]);
                                }
                            }
                            return parsedData;
                        }
                        function drawChart() {
                            gData = new google.visualization.DataTable();
                            gData.addColumn('string', 'Parent');
                            gData.addColumn('string', 'Child');
                            gData.addColumn('number', 'Weight');
                            
    
                            let graphData = ${JSON.stringify(graphData)};
                            let parsedData = parseData(graphData);
                            if (parsedData.length == 0) {
                                let ele = document.getElementById('resourceGraph');
                                ele.textContent = "No Conflict found."
                                return;
                            }
                            gData.addRows( parsedData);
                            gData.sort([{column: 2}]);

                            gChart = new google.visualization.Sankey(document.getElementById('resourceGraph'));
                            gChart.draw(gData, options);
                        } 
                   
                        function addNodeClickHandler(){
                            let nodes = document.querySelectorAll('th.resource-string');
                            nodes.forEach( node =>{
                                node.addEventListener('click', nodeClickHandler);
                            })
                        }
                        function getResourceString(textContent){
                            let tokens= textContent.split(" ");
                            return tokens[tokens.length -1];
                        }

                        function nodeClickHandler(e){
                            let {textContent} = e.target;
                            let resourceString = getResourceString( textContent);
                            let prevNode = document.querySelector('th.highlight');
                            let prevResourceString = (function(node){
                                if (!prevNode){
                                    return;
                                }

                                return getResourceString(node.textContent);
                                    
                            })(prevNode);
                            gChart.setSelection(null);

                            if (prevNode){
                                prevNode.classList.remove('highlight');
                            }
                            if (prevResourceString != resourceString){
                                e.target.classList.add('highlight');
                            }else{
                                return;
                            }
                            

                            let selections=(function(){
                                let rows = gData.getFilteredRows([{column:1, value: resourceString }]);
                                if (rows.length==0){
                                    rows = gData.getFilteredRows([{column:0, value: resourceString }]);
                                }
                                return rows.reduce( (acc,curr)=>{
                                    let r={
                                        row: curr
                                    }
                                    acc.push(r);
                                    return acc;
                                }, []);
                            })();
                            gChart.setSelection(selections);

                        }
                    </script>

            </head>
            <body>
                <h1> Policy Permisson Report</h1>
                <h2> File(s): <div class="files_container"> ${policyFileName}</div> </h2>
                <h2> Resource Graph</h2>
                
                <div id='resourceGraph' class='graph_container'></div>
                <h2> Permissions </h2>
                <div class='table_container'>
                    ${htmlStr}
                </div>
                <div class='footer_container'>
                        <div class='notice_container'>
                            <div>
                                <a target = "_blank"
                                href = "https://icons8.com/icon/5tH5sHqq0t2q/warning" > Warning </a>icon by <a target="_blank" href="https://icons8.com ">Icons8</a>
                            </div>
                            <div>
                                <a target = "_blank"
                                href = "https://icons8.com/icon/21085/info" > Info </a> icon by <a target="_blank" href="https://icons8.com ">Icons8</a>
                            </div>
                        </div>
                </div>
            </body>
        </html>
    `;
}
function writeToFile(data, filename){
    const outputDir='output';

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    fs.writeFileSync(`${outputDir}/${filename}`, data);
}
function generateHTMLReport(jsonData, graphData, filename, policyFileName, mergedFilesDetails) {
   let htmlReport = convHTMLReport(jsonData, graphData, policyFileName, mergedFilesDetails);
   if (!filename){
       console.log(htmlReport);
       return htmlReport;
   }
   writeToFile(htmlReport, filename);
}

module.exports={
    parseResourceName
    , getResourceActions
    , createWildCardResourceRegex
    , createRegex
    , deepCopy
    , convHTMLReport
    , convJson2Html
    , writeToFile
    , generateHTMLReport
    , mergeAllowDenyDetails
    , mergeAllowDenyActions
};