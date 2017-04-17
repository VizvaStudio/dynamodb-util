const AWS = require('aws-sdk');
const jsonfile = require('jsonfile');
const async = require('async');
const log = require('./log-helper.js')
const dynamoDBHelper = require('./dynamodb-helper.js');

backupJSONToJSON = (source, callback) => {
    //TBD
}

backupJSONToDynamoDB = (soruce, target, callback) => {
    //TBD
}

backupDynamoDBToJSON = (source, target, callback) => {
    var sourceDynamoDB = dynamoDBHelper.getDynamoDBClient(source.aws);
    var param = {
        TableName: source.tableName,
        Limit: 10000,
    }
    var isCompleted = false
    var result = [];
    async.whilst(
        () => { return isCompleted != true },
        (cb) => {
            sourceDynamoDB.scan(param, (err, data) => {
                if (err) {
                    log.e(err);
                    return cb(err);
                }
                if (!data.LastEvaluatedKey)
                    isCompleted = true;
                else
                    param.ExclusiveStartKey = data.LastEvaluatedKey;
                result.push(...data.Items);
                log.i(result.length);
                cb();
            });
        },
        (err, n) => {
            if (err) {
                log.e('An error occured while creating the backup.');
                return callback(err);
            }
            else {
                jsonfile.writeFileSync(target.path, result);
                callback(null, 'Backup completed sucessfully.')
            }
        }
    );
}

backupDynamoDBToDynamoDB = (source, target, callback) => {
    var createTableParam = {
        TableName: target.tableName
    }
    var totalItemCount = 0, trasferredItem = 0;
    async.series([
        (callback) => {
            //Describe source table
            var AWS = dynamoDBHelper.getAWS(source.aws);
            var param = { TableName: source.tableName }
            dynamoDBHelper.describeTable(AWS, param, (err, result) => {
                if (err) {
                    log.e(err);
                    return callback(err);
                }
                totalItemCount = result.Table.ItemCount;
                createTableParam.AttributeDefinitions = result.Table.AttributeDefinitions;
                createTableParam.KeySchema = result.Table.KeySchema;
                createTableParam.ProvisionedThroughput = {
                    ReadCapacityUnits: result.Table.ProvisionedThroughput.ReadCapacityUnits,
                    WriteCapacityUnits: result.Table.ProvisionedThroughput.WriteCapacityUnits
                }
                if (result.Table.GlobalSecondaryIndexes) {
                    createTableParam.GlobalSecondaryIndexes = [];
                    result.Table.GlobalSecondaryIndexes.forEach((item) => {
                        var indexParam = {
                            IndexName: item.IndexName,
                            KeySchema: item.KeySchema,
                            Projection: item.Projection,
                            ProvisionedThroughput: {
                                ReadCapacityUnits: item.ProvisionedThroughput.ReadCapacityUnits,
                                WriteCapacityUnits: item.ProvisionedThroughput.WriteCapacityUnits
                            }
                        }
                        createTableParam.GlobalSecondaryIndexes.push(indexParam);
                    });
                }
                if (result.Table.LocalSecondaryIndexes) {
                    createTableParam.LocalSecondaryIndexes = [];
                    result.Table.LocalSecondaryIndexes.forEach((item) => {
                        var indexParam = {
                            IndexName: item.IndexName,
                            KeySchema: item.KeySchema,
                            Projection: item.Projection
                        }
                        createTableParam.LocalSecondaryIndexes.push(indexParam);
                    });
                }
                callback();
            })
        }, (callback) => {
            if (target.mode === 'create') {
                //Create target table
                var AWS = dynamoDBHelper.getAWS(target.aws);
                dynamoDBHelper.createTable(AWS, createTableParam, (err, result) => {
                    if (err) {
                        log.e(err);
                        return callback(err);
                    }
                    callback();
                })
            }
            else {
                callback();
            }
        }, (callback) => {
            //Waitfor table to be accessible
            var dynamoDBClient = dynamoDBHelper.getDynamoDBClient(target.aws);
            var param = { TableName: target.tableName };
            dynamoDBClient.waitFor('tableExists', param, (err, result) => {
                if (err) {
                    log.e(err);
                    return callback(err);
                }
                callback();
            })
        }, (callback) => {
            var sourceDynamoDB = dynamoDBHelper.getDynamoDBClient(source.aws);
            var targetDynamoDB = dynamoDBHelper.getDynamoDBClient(target.aws);
            var param = {
                TableName: source.tableName,
                Limit: 25,
            }
            var isCompleted = false
            async.whilst(
                () => { return isCompleted != true },
                (cb) => {
                    //Get the data from the source table
                    sourceDynamoDB.scan(param, (err, data) => {
                        if (err) {
                            log.e(err);
                            return cb(err);
                        }
                        if (!data.LastEvaluatedKey)
                            isCompleted = true;
                        else
                            param.ExclusiveStartKey = data.LastEvaluatedKey;
                        trasferredItem += data.Items.length;
                        log.i(`Total transferred :#${trasferredItem}, Total remaining :#${totalItemCount - trasferredItem}`);
                        //Write the target table
                        var reqParam = {};
                        reqParam[target.tableName] = [];
                        data.Items.forEach((item) => {
                            var putReq = {
                                PutRequest: {
                                    Item: item
                                }
                            }
                            reqParam[target.tableName].push(putReq)
                        });
                        targetDynamoDB.batchWriteItem({ 'RequestItems': reqParam }, (err, result) => {
                            if (err) {
                                log.e(err);
                                return cb(err);
                            }
                            cb();
                        })
                    });
                },
                (err, n) => {
                    callback();
                }
            );
        }], (err, result) => {
            if (err) {
                log.e('An error occured while creating the backup.');
                return callback(err);
            }
            else {
                callback(null, 'Backup completed sucessfully.')
            }
        })
}

module.exports = {
    backupDynamoDBToJSON: backupDynamoDBToJSON,
    backupDynamoDBToDynamoDB: backupDynamoDBToDynamoDB
}