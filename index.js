
const policy = require('./lib/policy');
const utils = require('./lib/utils');

main();

function main() {
    const usage = "\nUsage: node index.js <policy.json>";

    let {
        argv
    } = process;
    let [cmd, mainFile, policyFile, report] = argv;

    if (!policyFile) {
        console.log(usage);
        return;
    }

    (async function () {
        const policyInput = await require(policyFile);
        let procActions = policy.createResourceActions(policyInput);
        let {
            graph,
            resourceActions
        } = policy.applyResourceActions(procActions);
        
        
        utils.writeToFile(JSON.stringify(policyInput,null,2), 'data.json');
        utils.writeToFile(JSON.stringify(graph, null, 2), 'graph.json');
        utils.writeToFile(JSON.stringify(resourceActions, null, 2), 'resourceActions.json');
        utils.generateHTMLReport(resourceActions, graph,  'report.html');
    })();


}