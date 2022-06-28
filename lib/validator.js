const ALL_ENV_FLAG_ACTIONS=[ 'cloneFlag',
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

function validateFlagActions() {
    let elements = document.querySelectorAll('tr.allow>td:first-child');
    const regex = /:env\/\*:flag/g;
    
    let showWarnIcon = false;

    elements.forEach( element =>{
        let action = element.getAttribute('data-action');
        let resourceStr = element.getAttribute('data-resource-string');
        let source = element.getAttribute('data-source') || '';
        
        if (ALL_ENV_FLAG_ACTIONS.includes(action) && resourceStr.includes(':flag') ) {
            if (resourceStr.match(regex) || (!resourceStr.match(regex) && (source.length>0 && source.match(regex)))) {
                return;
            }
            
            const imgContainer = document.createElement('div');
            imgContainer.className='warning_container'

            const imgEle = document.createElement('img');
            imgEle.src = '../img/icons8-warning-48.png';
            imgEle.className='warning';
            imgContainer.prepend(imgEle);

            const msgEle = document.createElement('span');
            msgEle.textContent = "Environment scope action should be allowed in ALL environments";
            msgEle.className='tooltip';
            imgContainer.appendChild(msgEle);
            element.prepend(imgContainer);
            showWarnIcon=true;
        }
    })

    if (showWarnIcon){
        document.querySelector("div.notice_container").className = '';
    }
}


window.addEventListener('load', (event) => {
    validateFlagActions();

});
