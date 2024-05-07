# LaunchDarkly Policy Checker

Policy Checker is a command-line interface (CLI) tool for evaluating permissions and detecting overlaps in your LaunchDarkly permission policy. It generates insightful reports to help you understand and manage your policy effectively.

![](./img/overview.jpg)



## Features
- Evaluate resource permissions
- Display resources with overlapping permissions
- Valdiate Flag actions
- Generate comprehensive HTML report


see [CHANGELOG.md](CHANGELOG.md) for more details on the latest changes and improvements.



## Requirements
* Node.JS >= 16.14.0


## Installation
1. Clone the repository:
```
git clone https://github.com/your-username/policy-checker.git
```

2. Navigate to the project directory:
```

cd policy-checker
```

3. Install the required dependencies:
```
npm install
```

## Usage 
To run the Policy Checker, use one of the following commands:

To run using a sample policy:
```
npm run sample 
```
To parse single or multiple policy JSON file
``` 
node index.js -f <Policy>
node index.js -f <Policy>  -f <Policy>
```
To parse multiple policy JSON files in a directory
```
node index.js -d <Policy directory>
```

The generated reports will be saved in the ./output directory.

**`Note`**: Use the LaunchDarkly advanced editor to copy and save your policy, see documentation for more information [here.](https://docs.launchdarkly.com/home/members/role-policies#writing-policies-in-the-advanced-editor)


## Running tests   
To run the test suite, use the following command:
```
npm test
```

To run with Mocha -watch option during development

```
npm run dev
```

Example test output:
```
  Test policy
    ✔ Must return the actions for proj/*
    ✔ Must return the actions for env/*
  

  Test utils
    ✔ Must return the resource name from resource string
    ✔ Must return resource actions for resource name

```

### Output 
The following reports are generated in the `./output` directory
* data.json  - Your policy. Use the Advanced Editor in LaunchDarkly or API to copy your custom role policy

* graph.json - contains resources that have overlapping permissions, used in generating the chart.

* resourceActions.json - contains the resource permissions, used in generating the table.

* report.html -  HTML report



### Built With
* [JSON2HTML](https://json2html.com/)
* [Google Chart](https://developers.google.com/chart)
* [Icon8](https://icons8.com)
  
### Additional Resources
* [LaunchDarkly: Custom Roles](https://docs.launchdarkly.com/home/members/role-policies)
* [LaunchDarkly: Using Actions](https://docs.launchdarkly.com/home/members/role-actions)
