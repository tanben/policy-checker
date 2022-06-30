const ALL_ENV_FLAG_ACTIONS=[
    'cloneFlag',
    'createExperiment',
    'createFlag',
    'createFlagLink',
    'deleteExperiment',
    'deleteFlag',
    'deleteFlagLink',
    'updateAttachedGoals',
    'updateClientSideFlagAvailability',
    'updateDescription',
    'updateExperimentBaseline',
    'updateFlagCustomProperties',
    'updateFlagDefaultVariations',
    'updateFlagLink',
    'updateFlagVariations',
    'updateGlobalArchived',
    'updateIncludeInSnippet',
    'updateMaintainer',
    'updateName',
    'updateTags',
    'updateTemporary'
];

function evalEnvScope(elements){
    const regex = /:env\/\*:flag/g;
    let showWarnIcon = false;

    elements.forEach(element => {
        let action = element.getAttribute('data-action');
        let resourceStr = element.getAttribute('data-resource-string');
        let source = element.getAttribute('data-source') || '';

        if (ALL_ENV_FLAG_ACTIONS.includes(action) && resourceStr.includes(':flag')) {
            if (resourceStr.match(regex) || (!resourceStr.match(regex) && (source.length > 0 && source.match(regex)))) {
                return;
            }

            element.prepend( createWarningTooltip() );
            showWarnIcon = true;
        }
        
    })
    return showWarnIcon;
}

function evalMergeStatements(allowElements, denyElements) {
    permissiveActionCheck(allowElements, denyElements);
    denyActionCheck(allowElements, denyElements);
}
function denyActionCheck(allowElements, denyElements) {
    if (!MergedFilesDetails){
        return;
    }

    denyElements.forEach( (node, denyIdx)=>{
        let resourceStr = denyElements.item(denyIdx).getAttribute('data-resource-string');
        let action = node.querySelector('.action_content').textContent;

        if (!MergedFilesDetails[resourceStr] || (MergedFilesDetails[resourceStr].deny[action] && !MergedFilesDetails[resourceStr].deny[action])){
            return;
        }


        MergedFilesDetails[resourceStr].deny[action]
        node.firstChild.className += " warning_additive"

        let files = MergedFilesDetails[resourceStr].deny[action]
        if (files.length == 1) {
            return;
        }
        node.parentElement.querySelector('td:last-child').textContent += ` Policies =[ ${(files)?files:''} ]`

        node.prepend(createInfoTooltip ());
    });

}
function permissiveActionCheck(allowElements, denyElements) {
    if (denyElements.length == 0 || allowElements.length == 0) {
        return;
    }
    let createList = (nodeList) => {
        let arr = [];
        nodeList.forEach((value, index) => {
            arr.push(value.textContent)
        })
        return arr;
    }

    let denyValues = createList(denyElements);


    allowElements.forEach((node, allowIdx) => {
        let action = node.textContent;

        if (!action) {
            return;
        }

        let denyIdx = denyValues.indexOf(action);
        if (denyIdx == -1) {
            return;
        }

        let denyResourceString = denyElements.item(denyIdx).getAttribute('data-resource-string');
        let allowResourceString = allowElements[allowIdx].getAttribute('data-resource-string');;
        if (denyResourceString!= allowResourceString){
            return;
        }

        node = denyElements.item(denyIdx);
        node.firstChild.className += " warning_additive"
        node = denyElements.item(denyIdx);
        
        node.prepend(createInfoTooltip());

    })

}

function evalMergeStatements_legacy(allowElements, denyElements){
    if (denyElements.length==0 || allowElements.length==0){
        return;
    }
    let createList = (nodeList)=>{
        let arr=[];
        nodeList.forEach( (value, index)=>{
            arr.push(value.textContent)
        })
        return arr;
    }

    let denyValues= createList(denyElements);
    

    allowElements.forEach((node, allowIdx) => {
        let action = node.textContent;

        if (!action){
            return;
        }

        let denyIdx = denyValues.indexOf(action);
        if (denyIdx == -1) {
            return;
        }

        let denyResourceString = denyElements.item(denyIdx).getAttribute('data-resource-string');
        let allowResourceString = allowElements[allowIdx].getAttribute('data-resource-string');;
        if (denyResourceString != allowResourceString){
            return;
        }

        node = denyElements.item(denyIdx);
        node.firstChild.className += " warning_additive"
        node = denyElements.item(denyIdx);
        const imgContainer = document.createElement('div');
        imgContainer.className = 'warning_additive'

        const imgEle = document.createElement('img');
        imgEle.src = '../img/icons8-info-40.png';
        imgEle.className = 'warning';
        imgContainer.prepend(imgEle);

        const msgEle = document.createElement('span');
        msgEle.textContent = "Evaluating Multiple policies. More permissive action wins ";
        msgEle.className = 'tooltip';
        imgContainer.appendChild(msgEle);
        node.prepend(imgContainer);
        
    })

}

function validateFlagActions() {
    let allowElement = document.querySelectorAll('tr.allow>td:first-child');
    let denyElements = document.querySelectorAll('tr.deny>td:first-child');
    
    
    let showWarnIcon = (_ => {
        let  ret=false;
        ret = evalEnvScope(allowElement) || ret;
        ret = evalEnvScope(denyElements) || ret;
        ret = evalMergeStatements(allowElement, denyElements) || ret;
        return ret;
    })();
    
    if (showWarnIcon) {
        document.querySelector("div.notice_container").style = "display:block";
    }


}


function permissiveCheck(){
      let denyResourceString = denyElements.item(denyIdx).getAttribute('data-resource-string');
      let allowResourceString = allowElements[allowIdx].getAttribute('data-resource-string');;
      if (denyResourceString != allowResourceString) {
          return;
      }
}

function createWarningTooltip(){
    const imgContainer = document.createElement('div');
    imgContainer.className = 'warning_container'

    const imgEle = document.createElement('div');
    imgEle.className = 'warning_icon';

    const msgEle = document.createElement('span');
    msgEle.textContent = "Environment scope action should be allowed in ALL environments";
    msgEle.className = 'tooltip';
    
    imgEle.appendChild(msgEle);
    imgContainer.appendChild(imgEle);
    return imgContainer
}

function createInfoTooltip() {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'warning_container'

    const imgEle = document.createElement('div');
    imgEle.className = 'info_icon';

    const msgEle = document.createElement('span');
    msgEle.textContent = "Evalating Multiple policies. More permissive action wins ";
    msgEle.className = 'tooltip';

    imgEle.appendChild(msgEle);
    imgContainer.appendChild(imgEle);
    return imgContainer
}

window.addEventListener('load', (event) => {
    validateFlagActions();

});
