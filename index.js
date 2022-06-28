
const policy = require('./lib/policy');
const utils = require('./lib/utils');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));


main();

function usage() {
    let msg = `\nUsage: node index.js <option>`;
    let options = `\n\t-f <policy>\n\t-d <policy dir json files>`;
    console.log(msg + options);
    return msg + options;
}


function main() {
    let policyFile = argv.f;
    let inputDir = argv.d;

    if (!policyFile && !inputDir) {
        usage();
        return;
    }

    let result={hasError:false};
    if (policyFile){
        result = processPolicy(policyFile);
    }else{
        result = processPolicies(inputDir);
    }

    if (result.hasError) {
        return -1;
    }
    generateReport({
        ...result,
        policyFile
    });
}

function processPolicies(inputDir){

    let skipApplyAction= true;
    let allProcActions={};
    let allPolicyJSON=[];

    let files = fs.readdirSync(inputDir).filter(file => {
        return file.match(/\.json$/g)
    })

    for (let file of files){
         let {
             policyJSON, 
             procActions,
             hasError,
             errorMessage
         } = processPolicy(`${inputDir}/${file}`, skipApplyAction);
         if (hasError){
            continue;
         }
         allProcActions = Object.assign({}, allProcActions, procActions);
         allPolicyJSON= allPolicyJSON.concat(policyJSON);
    }

    let {
        graph,
        resourceActions
    } = policy.applyResourceActions(allProcActions);

    return({policyJSON: allPolicyJSON, graph, resourceActions, hasError:false});
}

function processPolicy(policyFile, skipApplyAction=false){
    if (!fs.existsSync(policyFile)) {
        let msg= `\nError: Policy File [${policyFile}] not found!\n`;
        console.log(msg);
        return {hasError:true, errorMessage:msg};
    }
    let data = fs.readFileSync(policyFile);
    let policyJSON = JSON.parse(data);
    let procActions = policy.createResourceActions(policyJSON);
    
    if (skipApplyAction) {
        return {policyJSON, procActions, hasError:false, errorMessage:undefined};
    }

    let {
        graph,
        resourceActions
    } = policy.applyResourceActions(procActions);

    return {data, policyJSON, graph, resourceActions,procActions, procActions, hasError:false, errorMessage:undefined};
}

function generateReport(params){
    let {
        policyJSON,
        graph,
        resourceActions,
        policyFile
    } = params;
    utils.writeToFile(JSON.stringify(policyJSON, null, 2), 'data.json');
    utils.writeToFile(JSON.stringify(graph, null, 2), 'graph.json');
    utils.writeToFile(JSON.stringify(resourceActions, null, 2), 'resourceActions.json');
    utils.generateHTMLReport(resourceActions, graph, 'report.html', policyFile);
}
function mainLegacy() {
    let { argv } = process;
    let [cmd, mainFile, policyFile] = argv;

    if (!policyFile) {
        usage();
        return;
    }
    if (!fs.existsSync(policyFile)) {
        console.log(`\nError: Policy File [${policyFile}] not found!\n`);
        return;
    }

    let data = fs.readFileSync(policyFile);
    let policyJSON = JSON.parse(data);
    let procActions = policy.createResourceActions(policyJSON);
    let {
        graph,
        resourceActions
    } = policy.applyResourceActions(procActions);


    utils.writeToFile(JSON.stringify(policyJSON, null, 2), 'data.json');
    utils.writeToFile(JSON.stringify(graph, null, 2), 'graph.json');
    utils.writeToFile(JSON.stringify(resourceActions, null, 2), 'resourceActions.json');
    utils.generateHTMLReport(resourceActions, graph, 'report.html', policyFile);


}