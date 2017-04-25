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