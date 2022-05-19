const utils = require('../lib/utils');

/**
 * 
 * @param {} policy 
 * @returns { 'proj/*':{allow:[], deny:[], type:'proj'}...} 
 */
function createResourceActions (policy) {
    let parsed = {};
    for (let statement of policy) {

        statement.resources.forEach(resourceString => {

            if (!parsed[resourceString]) {
                parsed[resourceString] = {
                    resourceString: '',
                    type: '',
                    allow: [],
                    deny: []
                }
            }

            const { actions: resourceActions, resourceName } = utils.getResourceActions(resourceString);
            parsed[resourceString].type = resourceName;
            parsed[resourceString].resourceString = resourceString;
            let item = (statement.effect == "allow") ? parsed[resourceString].allow : parsed[resourceString].deny;
            
            if (statement.actions.includes("*")) {
                item.push(...Object.keys(resourceActions))
            } else {
                item.push(...statement.actions)
            }
        })
    }
    return {
        ...parsed
    };
}

function applyAllowDenyActions(srcResourceAction, resourceActions){
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

function findMatchingResourceActions(lookupResourceName, resourceActions) {
    // resourceAction is 'proj/*':{allow:[], deny:[], type:[]}
    // lookupResourceName is 'proj/*'
    const regexStr = utils.createRegex(lookupResourceName);
    const regex = new RegExp(regexStr);
    let match = {};
    for (let resourceName in resourceActions) {
        
        if (resourceName.trim() ==lookupResourceName) {
            continue;
        }

        if (resourceName.trim().match(regex)) {
            match[resourceName] = utils.deepCopy(resourceActions[resourceName]);
        }

    }
    return match;
}


function applyResourceActions(resourceActions){
    let graphDependencies={};
    let tmpResourceActions = utils.deepCopy(resourceActions);

    for (let resourceActionName in tmpResourceActions) {
        
        let matchingResourceActions = findMatchingResourceActions(resourceActionName, tmpResourceActions);
        let updatedResourceActions = applyAllowDenyActions(tmpResourceActions[resourceActionName], matchingResourceActions);
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