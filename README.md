# dynamodb-util
AWS DynamoDB utility in NodeJS to simplify working with the dynamodb data.

## Installation
Typically you would use this as command line utility.
```
npm install -g dynamodb-util
```

## Command
```
dynamodb-util --config .\config.json --command  listtables
```
**Note:** Use absolute path while specifying the config.json

## List of supported commands
* listtables
* listrecords
* describe
* backup

## Config file format

###Type1
Backup from DynamoDB to JSON file

```
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

###Type2
Backup from DynamoDB to DynamoDB

```
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
        "mode": "append",
        "tableName": "<<TableName>>",
        "aws": {
            "accessKeyId": "<<accessKeyId>>",
            "secretAccessKey": "<<secretAccessKey>>",
            "region": "<<region>>"
        }
    }
}
```
