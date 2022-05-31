
const chai = require('chai');
const utils = require('../lib/utils');
const policy = require('../lib/policy');


const assert = chai.assert;
const expect = chai.expect;


describe('Test policy', function() {
    it('Must not include notAction list', function(done) {
        
        const samplePolicy=[
            {
                actions:["*"],
                effect:"allow",
                resources: ["proj/demo"]
            }
            ,
            {
                notActions:["updateProjectName"],
                effect:"deny",
                resources: ["proj/demo"]
            }
            ];

            
        let parsed = policy.createResourceActions(samplePolicy);
        assert.isNotEmpty(parsed)
        // console.log(parsed)
        assert.notIncludeMembers(parsed['proj/demo'].deny, ['updateProjectName']);
        assert.includeMembers(parsed['proj/demo'].allow, Object.keys(utils.getResourceActions('proj').actions));

        done();
    });
    it('Must create notResources entries', function(done) {
        
        const samplePolicy=[
            {
                actions:["*"],
                effect:"allow",
                notResources: ["proj/sandbox-b"]
            }
            ,
            {
                notActions:["updateProjectName"],
                effect:"deny",
                resources: ["proj/sandbox-b", "proj/sandbox-a"]
            }
            ];

            
        let parsed = policy.createResourceActions(samplePolicy);
        assert.isNotEmpty(parsed)
        // console.log(parsed)
        assert.notIncludeMembers(parsed['proj/sandbox-b'].deny, ['updateProjectName']);
        assert.includeMembers(parsed['!proj/sandbox-b'].allow, Object.keys(utils.getResourceActions('proj').actions));

        done();
    });

    it('Must return the actions for proj/*', function(done) {
        const resourceName='proj/*';
        const samplePolicy=[
            {
                actions:["*"],
                effect:"allow",
                resources: [resourceName]
            }
            ];

            
        let parsed = policy.createResourceActions(samplePolicy);
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'allowDetails', 'denyDetails', 'deny', 'resourceString']);
        assert.equal(parsed[resourceName].type, 'proj');
        assert.equal(parsed[resourceName].resourceString, resourceName);
        // console.log(parsed)
        assert.includeMembers(parsed[resourceName].allow, ['createProject', 'deleteProject']);
    

        done();
    });

    it('Must return the actions for env/*', function (done) {
        const resourceName = 'proj/*:env/*';
        const samplePolicy = [{
            actions: ["*"],
            effect: "allow",
            resources: [resourceName]
        }];


        let parsed = policy.createResourceActions(samplePolicy);
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'allowDetails', 'denyDetails', 'deny', 'resourceString']);
        assert.equal(parsed[resourceName].type, 'env');
        assert.includeMembers(parsed[resourceName].allow, ['createEnvironment', 'deleteEnvironment']);


        done();
    });

    it('Must return the actions for flag/*', function (done) {
        const resourceName = 'proj/*:env/*:flag/*';
        const samplePolicy = [{
            actions: ["*"],
            effect: "allow",
            resources: [resourceName]
        }];


        let parsed = policy.createResourceActions(samplePolicy);
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'allowDetails', 'denyDetails', 'deny', 'resourceString']);
        assert.equal(parsed[resourceName].type, 'flag');
        assert.includeMembers(parsed[resourceName].allow, ['applyApprovalRequest', 'copyFlagConfigFrom']);


        done();
    });

    it('Must return the combined actions for proj/*, env/*, flag/*', function (done) {
        
        const samplePolicy = [{
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*']
            },
            {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*:env/*']
            },
            {
                actions: ["*"],
                effect: "deny",
                resources: ['proj/*:env/*:flag/*']
            }
        ];


        let parsed = policy.createResourceActions(samplePolicy);
        // console.log(parsed)
        assert.hasAllKeys(parsed['proj/*'], ['type', 'allow',  'allowDetails', 'denyDetails', 'deny', 'resourceString']);
        assert.equal(parsed['proj/*'].type, 'proj');
        assert.equal(parsed['proj/*:env/*'].type, 'env');
        
        assert.equal(parsed['proj/*:env/*:flag/*'].type, 'flag');
        // check deny
        assert.includeMembers(parsed['proj/*:env/*:flag/*'].deny, ['applyApprovalRequest', 'copyFlagConfigFrom']);
        
        done();
    });
    it('Must apply Allow and Deny actions', function (done) {
        const samplePolicy = [
            {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*']
            }
        , {
                actions: ["createProject"],
                effect: "deny",
                resources: ['proj/demo']
            }
        ];

   
        let resourceActions = policy.createResourceActions(samplePolicy);
        assert.includeMembers(resourceActions['proj/*'].allow, Object.keys(utils.getResourceActions('proj/*').actions));
        
        let ret = policy.applyAllowDenyActions(resourceActions['proj/*'], resourceActions);
        // console.log(ret)
        assert.notIncludeMembers(ret['proj/demo'].allow, ['createProject']);
        assert.notDeepEqual(ret, resourceActions);
        done();
    })


    it('Must find matching(regex) for resource name proj/*', function (done) {

        const samplePolicy = [{
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*']
            },
            {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*:env/*']
            },
            {
                actions: ["*"],
                effect: "deny",
                resources: ['proj/*:env/*:flag/*']
            }
            , {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/demo1']
            }
            , {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/demo-key;tag1,tag2']
            }
        ];
        let resourceActions = policy.createResourceActions(samplePolicy);
        // console.log(resourceActions)
        let match = policy.findMatchingResourceActions('proj/*', resourceActions);
        assert.equal(Object.keys(match).length, 2);
        assert.hasAllKeys(match, ['proj/demo1', 'proj/demo-key;tag1,tag2']);
        done();
    });
    it('Must not match notResources resource string', function (done) {

        const samplePolicy = [
            {
                actions: ["updateTags"],
                effect: "allow",
                resources: ['proj/sandbox-a', 'proj/sandbox-b', 'proj/sandbox-c']
            }
            ,{
                actions: ["createSamlConfig"],
                effect: "allow",
                resources: ['acct/demo-account']
            }
            
            , {
                actions: ["viewProject"],
                effect: "allow",
                notResources: ['proj/sandbox-b']
            }
        ];
        let resourceActions = policy.createResourceActions(samplePolicy);
        let match = policy.findMatchingResourceActions('!proj/sandbox-b', resourceActions);
        assert.hasAllKeys( match, ['proj/sandbox-a','proj/sandbox-c']);
     
        match = policy.findMatchingResourceActions('!proj/sandbox-', resourceActions);
        assert.isEmpty(match);

        match = policy.findMatchingResourceActions('!acct/*', resourceActions);
        assert.isEmpty(match);

        match = policy.findMatchingResourceActions('!acct/new-account', resourceActions);
        assert.hasAllKeys(match, ['acct/demo-account']);
        
        done();
    });

    it('Must Apply resource actions for matching regex proj/*', function (done) {

        const samplePolicy = [{
                actions: ["viewProject"],
                effect: "allow",
                resources: ['proj/*']
            },
            {
                actions: ["*"],
                effect: "allow",
                resources: ['proj/*:env/*']
            },
            {
                actions: ["*"],
                effect: "deny",
                resources: ['proj/*:env/*:flag/*']
            }, {
                actions: ["updateProjectName"],
                effect: "allow",
                resources: ['proj/demo']
            }, {
                actions: ["createProject"],
                effect: "allow",
                resources: ['proj/demo;tag1,tag2']
            }
        ];
        let procActions = policy.createResourceActions(samplePolicy);
        let {graph, resourceActions} = policy.applyResourceActions(procActions);
        
        assert.includeMembers(graph['proj/*'], ['proj/demo', 'proj/demo;tag1,tag2']);
        assert.includeMembers(graph['proj/demo'], ['proj/demo;tag1,tag2']);
        assert.equal(graph['proj/demo;tag1,tag2'].length, 0);
        assert.includeMembers(resourceActions['proj/demo'].allow, ['updateProjectName', 'viewProject']);
        done();
    });
    it('Must include allowDetaila', function (done) {

        const samplePolicy = [
            {
                actions: ["viewProject"],
                effect: "allow",
                resources: ['proj/*']
            },{
                actions: ["updateTags"],
                effect: "allow",
                resources: ['proj/de*']
            }, {
                actions: ["updateProjectName"],
                effect: "allow",
                resources: ['proj/demo']
            }
        ];
        let procActions = policy.createResourceActions(samplePolicy);
        let {graph, resourceActions} = policy.applyResourceActions(procActions);
        
        assert.includeMembers(resourceActions['proj/demo'].allow, ['updateProjectName', 'viewProject', 'updateTags']);
        assert.hasAllKeys(resourceActions['proj/demo'].allowDetails, ['viewProject', 'updateTags']);
        // console.log(resourceActions['proj/demo'].allowDetails)
        // { viewProject: [ 'proj/*', 'proj/de*' ], updateTags: [ 'proj/de*' ] }
        assert.includeMembers(resourceActions['proj/demo'].allowDetails['viewProject'], ['proj/*', 'proj/de*']);
        assert.includeMembers(resourceActions['proj/demo'].allowDetails['updateTags'], [ 'proj/de*']);

        done();
    });
    it('Must include denyDetaila', function (done) {

        const samplePolicy = [
            {
                actions: ["viewProject"],
                effect: "deny",
                resources: ['proj/*']
            },{
                actions: ["updateTags"],
                effect: "deny",
                resources: ['proj/de*']
            }, {
                actions: ["updateProjectName"],
                effect: "deny",
                resources: ['proj/demo']
            }
        ];
        let procActions = policy.createResourceActions(samplePolicy);
        let {graph, resourceActions} = policy.applyResourceActions(procActions);
        // console.log(resourceActions['proj/demo'].denyDetails)
        
        assert.includeMembers(resourceActions['proj/demo'].deny, ['updateProjectName', 'viewProject', 'updateTags']);
        assert.hasAllKeys(resourceActions['proj/demo'].denyDetails, ['viewProject', 'updateTags']);
        // { viewProject: [ 'proj/*', 'proj/de*' ], updateTags: [ 'proj/de*' ] }
        assert.includeMembers(resourceActions['proj/demo'].denyDetails['viewProject'], ['proj/*', 'proj/de*']);
        assert.includeMembers(resourceActions['proj/demo'].denyDetails['updateTags'], [ 'proj/de*']);

        done();
    });
    it('Must not include in graph  proj/* for notResources', function (done) {

        const samplePolicy = [{
                actions: ["viewProject"],
                effect: "allow",
                resources: ['proj/sandbox-a','proj/sandbox-b', 'proj/*']
            },
            {
                actions: ['createProject'],
                effect: "deny",
                notResources: ['proj/sandbox-block']
            },
        ];
        let procActions = policy.createResourceActions(samplePolicy);
        let {graph, resourceActions} = policy.applyResourceActions(procActions);
        assert.includeMembers(graph['!proj/sandbox-block'], ["proj/sandbox-a", "proj/sandbox-b"]);
        assert.notIncludeMembers(graph['proj/*'],  ["!proj/sandbox-a"]);
        // assert.notIncludeMembers(graph['!proj/sandbox-block'],  ["proj/*"]);
        done();
    });
     it('Must Apply DENY resource actions for matching regex proj/*', function (done) {

         const samplePolicy = [
             {
                 "effect": "deny",
                 "actions": ["deleteProject"],
                 "resources": ["proj/*"]
             }, {
                 "effect": "allow",
                 "actions": ["updateTags"],
                 "resources": ["proj/*"]
             }
              , {
                  "effect": "allow",
                  "actions": ["createProject", "deleteProject"],
                  "resources": ["proj/sample", "proj/demo"]
              }
         ];
         let procActions = policy.createResourceActions(samplePolicy);
         let {
             graph,
             resourceActions
         } = policy.applyResourceActions(procActions);
        //  console.log(resourceActions)
         assert.hasAllKeys(resourceActions, ['proj/*', 'proj/sample', 'proj/demo'])
         assert.includeMembers(resourceActions['proj/sample'].allow, ['createProject', 'updateTags']);
         assert.notIncludeMembers(resourceActions['proj/sample'].allow, ['deleteProject']);
         assert.includeMembers(resourceActions['proj/*'].allow, ['updateTags']);
         assert.includeMembers(resourceActions['proj/*'].deny, ['deleteProject']);

         done();
     });
});