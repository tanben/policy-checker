
const policy = require('./lib/policy');
const utils = require('./lib/utils');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const _=require('lodash');
const path = require('path');

main();

function usage() {
    let msg = `\nUsage: node index.js <option>`;
    let options = `\n\t-f <policy>\n\t-d <policy dir json files>`;
    console.log(msg + options);
    return msg + options;
}


function main() {
    let inputFiles = argv.f;
    let inputDir = argv.d;
    
    if (!inputFiles && !inputDir) {
        usage();
        return;
    }
    let policies= inputFiles;

    let result={hasError:false};
    if (inputFiles && !_.isArray(inputFiles)){
        result = processPolicyFile(inputFiles);
    }else{
        if (_.isEmpty(inputFiles) && inputDir){
            policies = listFiles(inputDir);
            if (_.isEmpty(policies)) {
                console.log(`No Policy *.JSON file found in Path [${inputDir}]`);
                // exit abrupt
                process.exit(1);
            }
        }
        result = processPolicies(policies);
    }
    generateReport({
        ...result,
        policyFile:policies
    });
}

function listFiles(dir){
    let files = fs.readdirSync(dir).filter(file => {
        return file.match(/\.json$/g)
    }).map( file=>{ return path.join(dir, file)});
    return files;
}
function updateMergedFilesDetails(mergedFilesDetails, allResourceActions, resourceActions, file) {
    for (let key of Object.keys(resourceActions)) {
        resourceActions[key].deny.forEach( action=>{
            if (!mergedFilesDetails[key]){
                mergedFilesDetails[key]={
                    deny:{}
                }
            }

            if (!mergedFilesDetails[key].deny[action]){
                mergedFilesDetails[key].deny[action] = [];
            }
            if (!mergedFilesDetails[key].deny[action].includes(file)) {
                mergedFilesDetails[key].deny[action].push(file)
            }
        })
    }

}
function processPolicies(files){
    let allPolicyJSON=[];
    let allResourceActions={};
    let mergedFilesDetails={};

    for (let file of files){
         let {
             policyJSON,
             resourceActions,
             procActions,
             hasError,
             errorMessage
         } = processPolicyFile(file);

         allPolicyJSON = allPolicyJSON.concat(policyJSON);
        _.mergeWith(allResourceActions, resourceActions, mergeArray);
        updateMergedFilesDetails(mergedFilesDetails, allResourceActions, resourceActions, file);
    }
    let {
        graph,
        resourceActions
    } = policy.applyResourceActions(allResourceActions, {evaluateDenyActions:false});


    return ({
        policyJSON: allPolicyJSON,
        graph,
        resourceActions,
        mergedFilesDetails,
        hasError: false
    });
}

function processPolicyFile(policyFile) {
    if (!fs.existsSync(policyFile)) {
        let msg= `\nError: Policy File [${policyFile}] not found!\n`;
        return {hasError:true, errorMessage:msg};
    }
    let data = fs.readFileSync(policyFile);
    let policyJSON = JSON.parse(data);
    return processPolicy(policyJSON)
}

function processPolicy(policyJSON) {
    let procActions = policy.createResourceActions(policyJSON);

    let {
        graph,
        resourceActions
    } = policy.applyResourceActions(procActions);

    return {
        policyJSON,
        graph,
        resourceActions,
        procActions,
        hasError: false,
        errorMessage: undefined
    };
}

function generateReport(params){
    let {
        policyJSON,
        graph,
        resourceActions,
        policyFile,
        mergedFilesDetails
    } = params;
    utils.writeToFile(JSON.stringify(policyJSON, null, 2), 'data.json');
    utils.writeToFile(JSON.stringify(graph, null, 2), 'graph.json');
    utils.writeToFile(JSON.stringify(resourceActions, null, 2), 'resourceActions.json');
    utils.generateHTMLReport(resourceActions, graph, 'report.html', policyFile, mergedFilesDetails);
}

function mergeArray(a, b) {
    return _.isArray(a) ? _.union(a, b) : undefined;
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