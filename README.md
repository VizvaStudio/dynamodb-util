# dynamodb-util
AWS DynamoDB utility in NodeJS to simplify working with the dynamodb data.

# Replication
A helper class is provided with this utilty, using this you can easily setup dynamoDB replication using AWS lambda function. 

## Setup
* **Streams:** Enable DynamoDB streams with **new** and **old** image. 
* **Create Node Project:** Create a node project with the below code snippet or download the example project form the github (Make sure you have **dynamodb-util** package installed locally and available in the **node_modules**). 
* **Update target details:** Update the code with the target table name and aws credentails. 
* **Packaging:** Compress (.zip) the entire project including the **node_modules**. 
* **Create and deploy AWS Lambda Function:** Create a AWS lambda function with the above created package. 
* **Setup Triggers:** Add triggers to invoke from DynamoDB Stream.

```javascript
const ddbutil = require("dynamodb-util").replication;

module.exports.handler = (event, context, callback) => {
    var config = {
        "tableName": "<<TableName>>",
        "aws": {
            "accessKeyId": "<<accessKeyId>>",
            "secretAccessKey": "<<secretAccessKey>>",
            "region": "<<region>>"
        }
    }
    ddbutil.sync(config, event, callback);
}
```
# Util
A command line utility to backup dynamoDB to another dynamoDB table or to a JSON file. 

## Installation
Typically you would use this as command line utility.
```sh
npm install -g dynamodb-util
```
## Command
```sh
dynamodb-util --config .\config.json --command  listtables
```
**Note:** Use absolute path while specifying the config.json

## List of supported commands
* listtables
* listrecords
* describe
* backup
## Config file format

### Type1
Backup from DynamoDB to JSON file

```json
{
    "source": {
        "type": "dynamoDB",
        "tableName": "<<TableName>>",
        "aws": {
            "accessKeyId": "<<accessKeyId>>",
            "secretAccessKey": "<<secretAccessKey>>",
            "region": "<<region>>"
        }
    },
    "target": {
        "type": "json",
        "path": "./backup.json"
    }
}
```

### Type2
Backup from DynamoDB to DynamoDB

```json
{
    "source": {
        "type": "dynamoDB",
        "tableName": "<<TableName>>",
        "aws": {
            "accessKeyId": "<<accessKeyId>>",
            "secretAccessKey": "<<secretAccessKey>>",
            "region": "<<region>>"
        }
    },
    "target": {
        "type": "dynamoDB",
        "mode": "create",
        "tableName": "<<TableName>>",
        "aws": {
            "accessKeyId": "<<accessKeyId>>",
            "secretAccessKey": "<<secretAccessKey>>",
            "region": "<<region>>"
        }
    }
}
```

Target group supports 2 modes 
* create
* append

Use **create** mode if you want to create a the backup table with the excaly replica of source with keys, GSI (Global Seconday Index) and LSI (Local Secondary Index).

And use **append** mode if you already have a table and just want to copy the data from source to target table.  

## Contact Us
We are happy to help where we can, please feel free to contact via twitter @vizvastudio or email at athaseen@vizvastudio.com.