
const chai = require('chai');
const utils = require('../lib/utils');
const policy = require('../lib/policy');


const assert = chai.assert;
const expect = chai.expect;


describe('Test policy', function() {
  
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
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'deny', 'resourceString']);
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
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'deny', 'resourceString']);
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
        assert.hasAllKeys(parsed[resourceName], ['type', 'allow', 'deny', 'resourceString']);
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
        assert.hasAllKeys(parsed['proj/*'], ['type', 'allow', 'deny', 'resourceString']);
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
        // console.log(JSON.stringify(modResourceActions,null,2));
        assert.includeMembers(graph['proj/*'], ['proj/demo', 'proj/demo;tag1,tag2']);
        assert.includeMembers(graph['proj/demo'], ['proj/demo;tag1,tag2']);
        assert.equal(graph['proj/demo;tag1,tag2'].length, 0);
        assert.includeMembers(resourceActions['proj/demo'].allow, ['updateProjectName', 'viewProject']);
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