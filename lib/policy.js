const utils = require('../lib/utils');

function processResourceActions (statement, resourceString, parsed){

    const { actions: resourceActions, resourceName } = utils.getResourceActions(resourceString);
    parsed[resourceString].type = resourceName;
    parsed[resourceString].resourceString =  resourceString;
    let item = (statement.effect == "allow") ? parsed[resourceString].allow : parsed[resourceString].deny;

    let actionsRef = statement.actions? statement.actions: statement.notActions;
    
    if (actionsRef.includes("*")) {
        let tmpActions = (!statement.notActions)? Object.keys(resourceActions): [];
        item.push(...tmpActions)
    } else {
        let tmpActions = (!statement.notActions) ?actionsRef : Object.keys(resourceActions).filter( k=> !(actionsRef.includes(k)));

        item.push(...tmpActions)
    }
    return 
};

/**
 * 
 * @param {} policy 
 * @returns { 'proj/*':{allow:[], deny:[], type:'proj'}...} 
 */
function createResourceActions (policy) {
    // console.log(`createResourceActions(): policy=${JSON.stringify(policy)}`);
    let parsed = {};
    for (let statement of policy) {
        let stmnt = statement.resources? statement.resources: statement.notResources;
        stmnt.forEach(resourceString => {
            resourceString = (statement.notResources)?`!${resourceString}`: resourceString;
            if (!parsed[resourceString]) {
                parsed[resourceString] = {
                    resourceString: '',
                    type: '',
                    allow: [],
                    allowDetails:{},
                    deny: [],
                    denyDetails:{}
                }
            }
            processResourceActions( statement, resourceString, parsed);
        })
    }
    return {
        ...parsed
    };
}
function applyAllowDenyActions_legacy(srcResourceAction, resourceActions){
    // resourceAction    is 'proj/*':{allow:[], deny:[], type:[]}
    // srcResourceAction is 'proj/*':{allow:[], deny:[], type:[]}
    let tmpResourceActions = utils.deepCopy(resourceActions);
    srcResourceAction.allow = srcResourceAction.allow.filter( action=> !srcResourceAction.deny.includes(action));

    for (let resourceName in tmpResourceActions) {
        if (srcResourceAction.resourceString == resourceName) {
            continue;
        }
        tmpResourceActions[resourceName].allow.push(...srcResourceAction.allow);
        tmpResourceActions[resourceName].deny.push(...srcResourceAction.deny);
        tmpResourceActions[resourceName].allow = tmpResourceActions[resourceName].allow.filter(action => !tmpResourceActions[resourceName].deny.includes(action));

        let tmpSet = new Set(tmpResourceActions[resourceName].allow);
        tmpResourceActions[resourceName].allow = [...tmpSet];
        tmpSet = new Set(tmpResourceActions[resourceName].deny);
        tmpResourceActions[resourceName].deny = [...tmpSet];
    }
    return {...tmpResourceActions};
}

function setAllowSource(resourceName, srcResourceAction, tgtResourceActions, skipActions){

    for (let action of  tgtResourceActions[resourceName].allow){
        if ((!srcResourceAction.allow.includes(action) || skipActions.includes(action)) && !tgtResourceActions[resourceName].allowDetails[action]) {
            continue;
        }
        if (!tgtResourceActions[resourceName].allowDetails[action]){
            tgtResourceActions[resourceName].allowDetails[action]=[];
        }
        if (tgtResourceActions[resourceName].allowDetails[action].includes(srcResourceAction.resourceString)){
            continue;
        }
        tgtResourceActions[resourceName].allowDetails[action].push( srcResourceAction.resourceString ) ;
    }
}

function setDenySource(resourceName, srcResourceAction, tgtResourceActions, skipActions){

    for (let action of  tgtResourceActions[resourceName].deny){
        if ((!srcResourceAction.deny.includes(action) || skipActions.includes(action)) && !tgtResourceActions[resourceName].denyDetails[action]) {
            continue;
        }
        if (!tgtResourceActions[resourceName].denyDetails[action]){
            tgtResourceActions[resourceName].denyDetails[action]=[];
        }
        if (tgtResourceActions[resourceName].denyDetails[action].includes(srcResourceAction.resourceString)) {
            continue;
        }
        tgtResourceActions[resourceName].denyDetails[action].push( srcResourceAction.resourceString ) ;
    }

}

function filterActionInTarget(srcActions, tgtActions){
    return srcActions.filter( srcAction=> tgtActions.includes(srcAction));
}
function applyAllowDenyActions(srcResourceAction, resourceActions, options = {
    evaluateDenyActions: true,
    evaluateAllowActions: true,
    debug: false
}) {
    let tmpResourceActions = utils.deepCopy(resourceActions);
    srcResourceAction.allow = srcResourceAction.allow.filter( action=> !srcResourceAction.deny.includes(action));

    for (let resourceName in tmpResourceActions) {
        if (srcResourceAction.resourceString == resourceName) {
            continue;
        }
        let skipAllowActions = (options.evaluateAllowActions)? filterActionInTarget(srcResourceAction.allow, tmpResourceActions[resourceName].allow): [];
        let skipDenyActions = (options.evaluateDenyActions) ? filterActionInTarget(srcResourceAction.deny, tmpResourceActions[resourceName].deny) : [];
        
        tmpResourceActions[resourceName].allow.push(...srcResourceAction.allow);
        tmpResourceActions[resourceName].deny.push(...srcResourceAction.deny);

        if (options.evaluateDenyActions) {
            tmpResourceActions[resourceName].allow = tmpResourceActions[resourceName].allow.filter(action => !tmpResourceActions[resourceName].deny.includes(action));
        }
        

        let tmpSet = new Set(tmpResourceActions[resourceName].allow);
        tmpResourceActions[resourceName].allow = [...tmpSet];
        tmpSet = new Set(tmpResourceActions[resourceName].deny);
        tmpResourceActions[resourceName].deny = [...tmpSet];

        setAllowSource(resourceName, srcResourceAction, tmpResourceActions, skipAllowActions);
        setDenySource(resourceName, srcResourceAction, tmpResourceActions, skipDenyActions);
    }
    
    return {...tmpResourceActions};
}


function findMatchingResourceActions(lookupResourceName, resourceActions) {
    lookupResourceName = lookupResourceName.trim();
    const isNotResources = (lookupResourceName.charAt(0) == '!');
    let regexStr = utils.createRegex(lookupResourceName);
    if (isNotResources) {
        let normRegex= utils.createWildCardResourceRegex(lookupResourceName);
        regexStr = utils.createRegex(normRegex);
    } 

    const regex = new RegExp(regexStr);
    let matched = {};
    for (let resourceName in resourceActions) {
        resourceName = resourceName.trim();
        if (resourceName == lookupResourceName) {
            continue;
        }
        if (resourceName.match(regex)){
            matched[resourceName] = utils.deepCopy(resourceActions[resourceName]);
        }
    }

    if (isNotResources){
        regexStr = utils.createRegex(lookupResourceName);
        let notMatchKeys = Object.keys(matched).filter(key => !key.match(regexStr));
        let negList = {};
        notMatchKeys.forEach( key=> {
            negList[key] = {...matched[key]};
        });
        matched = utils.deepCopy(negList);
    }
    return matched;
}

function applyResourceActions(resourceActions, options = {
    evaluateDenyActions: true,
    evaluateAllowActions: true,
    debug: false
}) {
    let graphDependencies={};
    let tmpResourceActions = utils.deepCopy(resourceActions);
    const log= (msg, debug)=>{
        if (!debug){
            return;
        }
        console.log(msg);
    }
    for (let resourceActionName in tmpResourceActions) {
        
        log(`resourceActionName=${resourceActionName}`, options.debug)
        log(`tmpResourceActions=${JSON.stringify(tmpResourceActions)}`, options.debug)
        let matchingResourceActions = findMatchingResourceActions(resourceActionName, tmpResourceActions);
        let notResourcesList = Object.keys(matchingResourceActions).filter( m => (m.charAt(0)=='!')  );
        log('matchingResourceActions:', options.debug)
        log(matchingResourceActions, options.debug);

        for (let item of notResourcesList){
            delete matchingResourceActions [ item];
        }
        // # Skip global
        if (resourceActionName.charAt(0)=='!'){
            let excludeList=  Object.keys(matchingResourceActions).filter( m=>{
                let regStr='(.*)\/(\\*)';
                let regex=new RegExp(regStr);
                let tokens=m.match(regex);
                return (tokens && tokens[2]=='*');
            })
            for (let excludeItems of excludeList){
                delete matchingResourceActions [excludeItems];
            }
        }
        let updatedResourceActions = applyAllowDenyActions(tmpResourceActions[resourceActionName], matchingResourceActions, options);
        tmpResourceActions={...tmpResourceActions , ...updatedResourceActions};
        graphDependencies[resourceActionName] = Object.keys(matchingResourceActions);
    }

    return {resourceActions: tmpResourceActions, graph:graphDependencies};

}

module.exports= {
    createResourceActions
    , applyResourceActions
    , applyAllowDenyActions
    , findMatchingResourceActions
}