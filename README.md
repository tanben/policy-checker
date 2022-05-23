# Policy Checker

Policy checker is a CLI for evaluating and detecting overlaps in your LaunchDarkly custom role policy. 


![](./img/overview.jpg)

The report contains two sections
- Resource Graph. Displays the resources that have overlapping permissions.
- Permissions Table. The Table contains extrapolated **Allowed** permissions for all resources.

### Resource Graph
The resource graph shows overlapping statements in your policy. 

Using this sample Policy JSON:

*file: policy.json*
```json
[
  {
    "effect": "allow",
    "actions": [
      "createProject",
      "deleteProject"
    ],
    "resources": [
      "proj/*"
    ]
  },
  {
    "effect": "allow",
    "actions": [
      "updateTags"
    ],
    "resources": [
      "proj/demo"
    ]
  }
]
```
>  See  [Understanding  policies](https://docs.launchdarkly.com/home/members/role-policies#understanding-policies) for details on Policy attributes.

The above Policy would produce a graph showing resource expression  `proj/*` matching `proj/demo` with the permissions table showing **Allowed** actions explicitly defined for `proj/demo` and extrapolated from `proj/*`.

*file: report.html*

![](./img/sample.jpg)


### Permissions Table
The permissions table shows **ALLOWED** actions listed in the **resourceActions.json**. 
> Deny action sets are not displayed.


*file: resourceActions.json*
```json
{
  "proj/*": {
    "resourceString": "proj/*",
    "type": "proj",
    "allow": [
      "createProject",
      "deleteProject"
    ],
    "deny": []
  },
  "proj/demo": {
    "resourceString": "proj/demo",
    "type": "proj",
    "allow": [
      "updateTags",
      "createProject",
      "deleteProject"
    ],
    "deny": []
  }
}
```

## Features
- Evaluate resource permissions
- Display resources with overlapping permissions
see [CHANGELOG.md](CHANGELOG.md) for details.


# Getting Started
## Requirements
* Node.JS >= 16.14.0

## Built With
* [JSON2HTML](https://json2html.com/)
* [Google Chart](https://developers.google.com/chart)


## Installation
1. Install NodeJS packages.
```
$> npm install
```


# Usage 
Run the policy checker using this sample command, this will generate the reports in `./output` directory.
To run using sample policy
```
npm run sample 
```
``` 
node index.js <Policy file JSON>
```

> Note: Use the LaunchDarkly advanced editor to copy and save your policy, see doc [here](https://docs.launchdarkly.com/home/members/role-policies#writing-policies-in-the-advanced-editor)


### Run tests   
```
npm test
```

To run with Mocha -watch option during development

```
npm run dev
```

```
  Test policy
    ✔ Must return the actions for proj/*
    ✔ Must return the actions for env/*
  

  Test utils
    ✔ Must return the resource name from resource string
    ✔ Must return resource actions for resource name

```

## Output 
The following reports are generated in the `./output` directory
* data.json  - LaunchDarkly policy JSON file

* graph.json - contains resources and list of resources overlapps

* resourceActions.json - contains the resource and extrapolated permissions which are rendered on the HTML table

* report.html -  HTML report


# Documentation

### LaunchDarkly
* [Role Policies](https://docs.launchdarkly.com/home/members/role-policies)

* [Using Actions](https://docs.launchdarkly.com/home/members/role-actions)
