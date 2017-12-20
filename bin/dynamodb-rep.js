const AWS = require('aws-sdk');
const log = require('../lib/log-helper')
const dynamoDBHelper = require('../lib/dynamodb-helper');
const commonHelper = require('../lib/commonHelper');

const constants = {
    INSERT: 'INSERT',
    MODIFY: 'MODIFY',
    REMOVE: 'REMOVE'
}


sync = (config, streamEvent, callback) => {
    if (!config.aws)
        return callback('AWS credentials not passed');
    if (!config.tableName)
        return callback('Target table not passed');
    if (!streamEvent)
        return callback('event is undefined');
    var dynamoDb = commonHelper.getDynamoDBClient(config.aws);
    var reqParam = [];
    reqParam[config.tableName] = [];
    streamEvent.Records.forEach((record) => {
        switch (record.eventName) {
            case constants.INSERT:
            case constants.MODIFY:
                reqParam[config.tableName].push({
                    PutRequest: {
                        Item: record.dynamodb.NewImage
                    }
                });
                break;
            case constants.REMOVE:
                reqParam[config.tableName].push({
                    DeleteRequest: {
                        Key: record.dynamodb.Keys
                    }
                });
                break;
            default:
                callback('unknown event name');
                break;
        }
    });
    dynamoDb.batchWriteItem({ 'RequestItems': reqParam }, (err, result) => {
        if (err) {
            return callback(err);
        }
        else {
            callback();
        }
    })
}


module.exports = {
    sync: sync
}