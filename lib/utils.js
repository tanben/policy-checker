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
        throw new Error(`Missing resouce actions for [${resourceName}] in actions.json`);
    }

    return {actions, resourceName};
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
        let regexStr = resource.replace('/', '\\/');
        
        if (i + 1 == sections.length) {
            regexStr = regexStr.replace('*', '(?!.*:).*');
        } else {
            regexStr = (i < sections.length) ? regexStr.replace('*', '.*(;.*)*') :
                regexStr.replace("*", '.*(;|,+)');
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

function deepCopy( sourceObj ){
    return JSON.parse(JSON.stringify(sourceObj));
}
function convJson2Html(jsonData){
    let data = [];
    for (let resourceName in jsonData) {
        let {
            allow,
            deny,
            type
        } = jsonData[resourceName];


        let allowDetails = allow.map(action => ({
                id: action,
                description: ResourceActions[type][action]
        }));

        if (resourceName.charAt(0)=='!'){
            resourceName= resourceName.replace('!','[notResources] ');
        }
        data.push({
            resourceName,
            type: type.toUpperCase(),
            allow: allowDetails
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
                        'colspan': '2',
                        'text': '[ ${type} ]   ${resourceName}'
                    }]
                }, {
                    '<>': 'tbody',
                    'html': [{
                        '<>': 'tr',
                        'html': [{
                            '<>': 'td',
                            'text': '${id}'
                        }, {
                            '<>': 'td',
                            'text': '${description}'
                        }],
                        '{}': function () {
                            return this.allow
                        }
                    }]
                }]
            }]
        }
    ];
    // console.log(JSON.stringify(data,null,2))
    return json2html.render(data, template); 
}
function convHTMLReport(jsonData, graphData) {
    let htmlStr = convJson2Html(jsonData);
    return `
        <html>
            <head>
                <link rel = "stylesheet" href = "../styles/styles.css" />
                    <script type = "text/javascript" src = "https://www.gstatic.com/charts/loader.js"> </script> 
                    <script type = "text/javascript"> 
                        google.charts.load('current', {'packages': ['sankey']});
                        google.charts.setOnLoadCallback(drawChart);

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
                           var data = new google.visualization.DataTable();
                           data.addColumn('string', 'Parent');
                           data.addColumn('string', 'Child');
                           data.addColumn('number', 'Weight');
                        

                           let graphData = ${JSON.stringify(graphData)};
                           data.addRows( parseData(graphData));
                            var colors = ['#a6cee3', '#b2df8a', '#fb9a99', '#fdbf6f',
                                '#cab2d6', '#ffff99', '#1f78b4', '#33a02c'
                            ];

                           var options = {
                              width: 800,
                              height: 400,
                              sankey: {
                                node: {
                                    colors: colors
                                },
                                link: {
                                    colorMode: 'gradient',
                                    colors: colors
                                }
                              }
                           };
                           var chart = new google.visualization.Sankey(document.getElementById('resourceGraph'));
                           chart.draw(data, options);
                       } 
                    </script>
            </head>
            <body>
                <h1> Policy Permisson Report</h1>
                <h2> Resource Graph</h2>
                <div id='resourceGraph' class='graph_container'></div>
                <h2> Allowed Permissions </h2>
                ${htmlStr}
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
function generateHTMLReport(jsonData, graphData, filename){
   
   let htmlReport = convHTMLReport(jsonData, graphData);
   if (!filename){
       console.log(htmlReport);
       return htmlReport;
   }
   writeToFile(htmlReport, filename);
}

module.exports={
    parseResourceName
    , getResourceActions
    , createRegex
    , deepCopy
    , convHTMLReport
    , convJson2Html
    , writeToFile
    , generateHTMLReport
};