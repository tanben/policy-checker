
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
            "deny": [   "deleteProject"]
          },

          "proj/*": {
            "resourceString": "proj/*",
            "type": "proj",
            "allow": [ "updateTags"  ],
            "deny": [  "deleteProject" ]
          },
        };
      let htmlStr = utils.convJson2Html(rawData);
      // console.log(htmlStr);
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
          "deny": ["deleteProject"]
        },

        "proj/*": {
          "resourceString": "proj/*",
          "type": "proj",
          "allow": ["updateTags"],
          "deny": ["deleteProject"]
        },
      };
      let htmlReport = utils.convHTMLReport(rawData);
      // console.log(htmlReport);
      assert.isTrue(htmlReport.includes('createProject'));
      assert.isTrue(htmlReport.includes('updateTags'));
      assert.isTrue(htmlReport.includes('<html>'));
      assert.isTrue(htmlReport.includes('<body>'));
      
      done();
    });
});