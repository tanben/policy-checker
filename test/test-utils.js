
const chai = require('chai');
const utils = require('../lib/utils');

const assert = chai.assert;
const expect = chai.expect;


describe('Test utils', function() {
  
  it('Must return the resource name from resource string', function(done) {
    
    assert.equal(utils.parseResourceName('proj/*'), 'proj');
    assert.equal(utils.parseResourceName('proj/*:env/*'), 'env');
    assert.equal(utils.parseResourceName('proj/*:env/*:flag'), 'flag');

    done();
  });

  it('Must return resource actions for resource name', function (done) {
    assert.hasAnyKeys(utils.getResourceActions('proj').actions, ['createProject', 'viewProject']);
    assert.hasAnyKeys(utils.getResourceActions('acct').actions, ['createSamlConfig', 'createScimConfig']);

    assert.hasAnyKeys(utils.getResourceActions('proj/*').actions, ['createProject', 'viewProject']);
    assert.equal(utils.getResourceActions('proj/*').resourceName,'proj');
    assert.hasAnyKeys(utils.getResourceActions('acct/*').actions, ['createSamlConfig', 'createScimConfig']);
    assert.equal(utils.getResourceActions('acct/*').resourceName, 'acct');
    assert.hasAnyKeys(utils.getResourceActions('proj/*:env/*').actions, ['createEnvironment', 'updateApiKey']);
    assert.equal(utils.getResourceActions('proj/*:env/*').resourceName, 'env');
    assert.hasAnyKeys(utils.getResourceActions('proj/*:env/*:flag/*').actions, ['applyApprovalRequest', 'copyFlagConfigFrom']);
    assert.equal(utils.getResourceActions('proj/*:env/*:flag/*').resourceName, 'flag');
    
    done();
  });

  it('Must throw exception for unknown resource name', function (done) {
    assert.throws(_=>utils.getResourceActions('tada', 'Error: Missings resouce actions for [tada] in actions.json'));
    done();
  });

  const g_resourceUrls = [
        'proj/*', 
        'proj/*;tag1', 
        'proj/*;tag1,tag2', 
        'proj/demoa', 
        'proj/demo', 
        'proj/demo;tag1', 
        'proj/demo;tag2', 
        'proj/demo;tag1,tag2', 
        'proj/demo:env/*;tag1,tag2', 
        'proj/demo:env/*;tag1,tag2', 
        'proj/demo:env/*;tag1', 
        'proj/demo:env/*;tag2', 
        'proj/demo*;tag1', 
        'proj/demo-key;tag1', 
        'proj/demo1', 
        'proj/*:env/*', 
        'proj/*:env/*;tag1', 
        'proj/*:env/*;tag2', 
        'proj/*:env/*;tag1,tag2', 
        'proj/*:env/*;tag1,tag2:flag/*', 
        'proj/demo;tag2:env/production;tag1'
      ];
  it('Must create regex', function (done) {

    
    assert.equal(utils.createRegex('proj/demo'), 'proj\\/demo(?!.*:).*');
    assert.equal(utils.createRegex('!proj/demo'), 'proj\\/demo(?!.*:).*');

    assert.equal( utils.createRegex('proj/demo:env/*'), 'proj\\/demo:env\\/(?!.*:).*');
    assert.equal( utils.createRegex('!proj/demo:env/*'), 'proj\\/demo:env\\/(?!.*:).*');

    done();
  });
  it('Must match Regex for proj/* resource string', function (done) {

    let matchMembers = [
      'proj/*',
      'proj/*;tag1',
      'proj/*;tag1,tag2',
      'proj/demoa',
      'proj/demo',
      'proj/demo;tag1',
      'proj/demo;tag2',
      'proj/demo;tag1,tag2',
      'proj/demo*;tag1',
      'proj/demo-key;tag1',
      'proj/demo1'
    ];
    
    let regexStr= utils.createRegex('proj/*');
    // /proj\/(?!.*:).*/
    let regex = new RegExp(regexStr);
    let match = g_resourceUrls.filter(resourceUrl => resourceUrl.trim().match(regex));
    // console.log(regex)
    // console.log(match)
    assert.equal(match.length, 11)
    assert.includeMembers(match, matchMembers);


    done();
  });
  
  it('Must match Regex for proj/* resource string', function (done) {

    let resources = [
      'proj/sandbox-a'
      ,'proj/sandbox-b'
      , 'proj/sandbox-c'
      ,'acct/testaccount'
    ];

    let regexStr = utils.createRegex('proj/*-*');
    let regex = new RegExp(regexStr);
    let match = resources.filter(resourceUrl => resourceUrl.trim().match(regex));
    assert.includeMembers(match, ['proj/sandbox-a', 'proj/sandbox-b','proj/sandbox-c'])
    done();
  });
  
  it('Must match Regex for proj/*:env/* resource string', function (done) {

     let matchMembers = [
         'proj/demo:env/*;tag1,tag2',
         'proj/demo:env/*;tag1,tag2',
         'proj/demo:env/*;tag1',
         'proj/demo:env/*;tag2',
         'proj/*:env/*',
         'proj/*:env/*;tag1',
         'proj/*:env/*;tag2',
         'proj/*:env/*;tag1,tag2',
         'proj/demo;tag2:env/production;tag1'
     ];

     let regexStr = utils.createRegex('proj/*:env/*');

     let regex = new RegExp(regexStr);
     let match = g_resourceUrls.filter(resourceUrl => resourceUrl.trim().match(regex));
    //  console.log(regex)
    //  console.log(match)
     assert.equal(match.length, 9)
     assert.includeMembers(match, matchMembers);


     done();
   });
   it('Must match Regex for proj/*:env/*;tag1 resource string', function (done) {

     let matchMembers = [
       'proj/demo:env/*;tag1,tag2',
       'proj/demo:env/*;tag1,tag2',
       'proj/demo:env/*;tag1',
       'proj/*:env/*;tag1',
       'proj/*:env/*;tag1,tag2',
       'proj/demo;tag2:env/production;tag1'
     ];

     let regexStr = utils.createRegex('proj/*:env/*;tag1');

     let regex = new RegExp(regexStr);
     let match = g_resourceUrls.filter(resourceUrl => resourceUrl.trim().match(regex));
    //  console.log(regex)
    //  console.log(match)
     assert.equal(match.length, 6)
     assert.includeMembers(match, matchMembers);
     done();
   });
  it('Must match Regex for proj/*:env/*:flag/* resource string', function (done) {

    let matchMembers = [
       'proj/*:env/*;tag1,tag2:flag/*'
    ];

    let regexStr = utils.createRegex('proj/*:env/*:flag/*');

    let regex = new RegExp(regexStr);
    let match = g_resourceUrls.filter(resourceUrl => resourceUrl.trim().match(regex));
    //  console.log(regex)
    //  console.log(match)
    assert.equal(match.length, 1)
    assert.includeMembers(match, matchMembers);
    done();
  });

   it('Must generate HTML from JSON data using json2html', function (done) {
      let rawData = {
          "proj/sample": {
            "resourceString": "proj/sample",
            "type": "proj",
            "allow": [ "createProject",    "updateTags"   ],
            "allowDetails":{"updateTags":['proj/*']},
            "deny": [   "deleteProject"],
            "denyDetails":{'deleteProject':['proj/*']}
          },

          "proj/*": {
            "resourceString": "proj/*",
            "type": "proj",
            "allow": [ "updateTags"  ],
            "allowDetails":{},
            "deny": [  "deleteProject" ],
            "denyDetails":{}
          },
        };
      let htmlStr = utils.convJson2Html(rawData);
      assert.isTrue(htmlStr.includes('createProject'));
      assert.isTrue(htmlStr.includes('updateTags'));
      done();
   });
  it('Must generate HTML Report from JSON data', function (done) {
    let rawData = {
      "proj/sample": {
        "resourceString": "proj/sample",
        "type": "proj",
        "allow": ["createProject", "updateTags"],
        "deny": ["deleteProject"],
        "allowDetails":{"updateTags":['proj/*']},
        "denyDetails":{"deleteProject":['proj/*']}

      },

      "proj/*": {
        "resourceString": "proj/*",
        "type": "proj",
        "allow": ["updateTags"],
        "deny": ["deleteProject"],
        "allowDetails":{},
        "denyDetails":{}

      },
    };
    let htmlReport = utils.convHTMLReport(rawData);
    assert.isTrue(htmlReport.includes('createProject'));
    assert.isTrue(htmlReport.includes('updateTags'));
    assert.isTrue(htmlReport.includes('<html>'));
    assert.isTrue(htmlReport.includes('<body>'));
    
    done();
  });

  it('Must merge allow & deny Details objects', function (done) {
    let rs1={
      "proj/demo": {
        "resourceString": "proj/demo",
        "type": "proj",
        "allowDetails": { "viewProject": ["proj/*" ]  },
        "denyDetails": { "viewProject": ["proj/*" ]  }
      }
    };
    let rs2={
      "proj/demo": {
        "resourceString": "proj/demo",
        "type": "proj",
        "allowDetails": { "updateTags": [ "proj/*" ] },
        "denyDetails": {}
      }
    };
    
    
    let output = utils.mergeAllowDenyDetails(rs1['proj/demo'].allowDetails, rs2['proj/demo'].allowDetails);
    // console.log(output)
    assert.hasAllKeys(output, ['viewProject', 'updateTags']);
    
    output = utils.mergeAllowDenyDetails(rs1['proj/demo'].denyDetails, rs2['proj/demo'].denyDetails);
    assert.hasAllKeys(output, ['viewProject']);
    done();
  });

  it('Must merge allow & deny actions objects', function (done) {
    let rs1={
      "proj/demo": {
        "resourceString": "proj/demo",
        "type": "proj",
        "allow":['viewProject'],
        "deny":[]
      }
    };
    let rs2={
      "proj/demo": {
        "resourceString": "proj/demo",
        "type": "proj",
        "allow":['updateTags'],
        "deny":['viewProject']
      }
    };
    
    
    let output = utils.mergeAllowDenyActions(rs1['proj/demo'].allow, rs2['proj/demo'].allow);
    // console.log(output)
    assert.includeMembers(output, ['viewProject', 'updateTags']);
    
    output = utils.mergeAllowDenyActions(rs1['proj/demo'].deny, rs2['proj/demo'].deny);
    assert.includeMembers(output, ['viewProject']);
    
    done();
  });

});