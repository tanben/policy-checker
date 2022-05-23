
const policy = require('./lib/policy');
const utils = require('./lib/utils');
const fs = require('fs');

main();

function main() {
    const usage = "\nUsage: node index.js <LD Policy file>";

    let { argv } = process;
    let [cmd, mainFile, policyFile, report] = argv;

    if (!policyFile) {
        console.log(usage);
        return;
    }
    if (!fs.existsSync(policyFile)){
        console.log(`\nError: Policy File [${policyFile}] not found!\n`);
        return;
    }

    let data = fs.readFileSync(policyFile);
    let policyJSON = JSON.parse(data);
    let procActions = policy.createResourceActions(policyJSON);
    let { graph, resourceActions } = policy.applyResourceActions(procActions);
    
    
    utils.writeToFile(JSON.stringify(policyJSON,null,2), 'data.json');
    utils.writeToFile(JSON.stringify(graph, null, 2), 'graph.json');
    utils.writeToFile(JSON.stringify(resourceActions, null, 2), 'resourceActions.json');
    utils.generateHTMLReport(resourceActions, graph,  'report.html');
    

}