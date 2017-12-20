const AWS = require('aws-sdk');
const jsonfile = require('jsonfile');
const os = require('os');
const async = require('async');
const log = require('./log-helper.js')
const dynamoDBHelper = require('./dynamodb-helper.js');
const commonHelper = require('./common-helper');

backupJSONToDynamoDB = (soruce, target, callback) => {
    //TBD
}

backupDynamoDBToS3 = (source, target, callback) => {
    var sourceDynamoDB = commonHelper.getDynamoDBClient(source.aws);
    var readable = require('stream').Readable();
    var s3Stream = require('s3-upload-stream')(commonHelper.getS3Client(target.aws));
    var param = {
        TableName: source.tableName,
        Limit: 10000,
    }
    var isCompleted = false
        , totalItemCount = 0
        , trasferredItem = 0;
    async.series([
        (cb) => {
            //Describe source table
            var AWS = commonHelper.getAWS(source.aws);
            var param = { TableName: source.tableName }
            dynamoDBHelper.describeTable(AWS, param, (err, result) => {
                if (err) {
                    log.e(err); cb(err); return;
                }
                totalItemCount = result.Table.ItemCount;
                cb();
            });
        },
        (cb) => {
            var upload = s3Stream.upload({
                "Bucket": target.bucketName,
                "Key": target.keyName
            });
            readable._read = function (n) { };
            readable.pipe(upload);
            cb()
        },
        (cb) => {
            async.whilst(
                () => { return isCompleted != true },
                (cb) => {
                    sourceDynamoDB.scan(param, (err, data) => {
                        if (err) {
                            log.e(err); cb(err); return;
                        }
                        if (!data.LastEvaluatedKey)
                            isCompleted = true;
                        else
                            param.ExclusiveStartKey = data.LastEvaluatedKey;
                        data.Items.forEach(element => {
                            readable.push(JSON.stringify(element) + os.EOL);
                        });

                        //result.push(...data.Items);
                        trasferredItem += data.Items.length;
                        var remaining = totalItemCount - trasferredItem;
                        log.i(`Total transferred :#${trasferredItem}, Total remaining :#${remaining >= 0 ? remaining : 0}`);
                        cb();
                    });
                },
                (err, n) => {
                    if (err) {
                        log.e('An error occured while creating the backup.');
                        callback(err); return;
                    }
                    else {
                        log.i(`Writing data to the file.`);
                        readable.push(null);
                        //jsonfile.writeFileSync(target.path, result);
                        callback(null, 'Backup completed sucessfully.')
                    }
                }
            );
        }

    ], (err, result) => {
        if (err) {
            log.e('An error occured while creating the backup.');
            callback(err); return;
        }
        else {
            callback(null, 'Backup completed sucessfully.')
        }
    })
}

backupDynamoDBToJSON = (source, target, callback) => {
    var sourceDynamoDB = commonHelper.getDynamoDBClient(source.aws);
    var param = {
        TableName: source.tableName,
        Limit: 10000,
    }
    var isCompleted = false
        , result = []
        , totalItemCount = 0
        , trasferredItem = 0;
    async.series([
        (callback) => {
            //Describe source table
            var AWS = commonHelper.getAWS(source.aws);
            var param = { TableName: source.tableName }
            dynamoDBHelper.describeTable(AWS, param, (err, result) => {
                if (err) {
                    log.e(err); callback(err); return;
                }
                totalItemCount = result.Table.ItemCount;
                callback();
            });
        },
        (callback) => {
            async.whilst(
                () => { return isCompleted != true },
                (cb) => {
                    sourceDynamoDB.scan(param, (err, data) => {
                        if (err) {
                            log.e(err); cb(err); return;
                        }
                        if (!data.LastEvaluatedKey)
                            isCompleted = true;
                        else
                            param.ExclusiveStartKey = data.LastEvaluatedKey;
                        result.push(...data.Items);
                        trasferredItem += data.Items.length;
                        var remaining = totalItemCount - trasferredItem;
                        log.i(`Total transferred :#${trasferredItem}, Total remaining :#${remaining >= 0 ? remaining : 0}`);
                        cb();
                    });
                },
                (err, n) => {
                    if (err) {
                        log.e('An error occured while creating the backup.');
                        callback(err); return;
                    }
                    else {
                        log.i(`Writing data to the file.`);
                        jsonfile.writeFileSync(target.path, result);
                        callback(null, 'Backup completed sucessfully.')
                    }
                }
            );
        }
    ], (err, result) => {
        if (err) {
            log.e('An error occured while creating the backup.');
            callback(err); return;
        }
        else {
            callback(null, 'Backup completed sucessfully.')
        }
    });
}

backupDynamoDBToDynamoDB = (source, target, callback) => {
    var createTableParam = {
        TableName: target.tableName
    }
    var totalItemCount = 0, trasferredItem = 0;
    async.series([
        (callback) => {
            //Describe source table
            var AWS = commonHelper.getAWS(source.aws);
            var param = { TableName: source.tableName }
            log.i('Extracting source table information...');
            dynamoDBHelper.describeTable(AWS, param, (err, result) => {
                if (err) {
                    callback(err); return;
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
                log.i('Creating target table...');
                var AWS = commonHelper.getAWS(target.aws);
                dynamoDBHelper.createTable(AWS, createTableParam, (err, result) => {
                    if (err) {
                        callback(err); return;
                    }
                    else {
                        callback();
                    }
                })
            }
            else if (target.mode === 'append') {
                var AWS = commonHelper.getAWS(target.aws);
                var param = { TableName: target.tableName }
                log.i('Validating if target table already exists...');
                dynamoDBHelper.describeTable(AWS, param, (err, result) => {
                    if (err) {
                        callback(err); return;
                    }
                    else {
                        callback();
                    }
                });
            }
            else {
                callback();
            }
        }, (callback) => {
            //Waitfor table to be accessible
            var dynamoDBClient = commonHelper.getDynamoDBClient(target.aws);
            var param = { TableName: target.tableName };
            dynamoDBClient.waitFor('tableExists', param, (err, result) => {
                if (err) {
                    callback(err); return;
                }
                callback();
            })
        }, (callback) => {
            var sourceDynamoDB = commonHelper.getDynamoDBClient(source.aws);
            var targetDynamoDB = commonHelper.getDynamoDBClient(target.aws);
            var param = {
                TableName: source.tableName,
                Limit: 25,
            }
            var isCompleted = false
            log.i('Backup started...');
            async.whilst(
                () => { return isCompleted != true },
                (cb) => {
                    //Get the data from the source table
                    sourceDynamoDB.scan(param, (err, data) => {
                        if (err) {
                            log.e(err); cb(err); return;
                        }
                        if (!data.LastEvaluatedKey)
                            isCompleted = true;
                        else
                            param.ExclusiveStartKey = data.LastEvaluatedKey;
                        trasferredItem += data.Items.length;
                        var remaining = totalItemCount - trasferredItem;
                        log.i(`Total transferred :#${trasferredItem}, Total remaining :#${remaining >= 0 ? remaining : 0}`);
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
                        if (reqParam[target.tableName].length > 0) {
                            targetDynamoDB.batchWriteItem({ 'RequestItems': reqParam }, (err, result) => {
                                if (err) {
                                    log.e(err); cb(err); return;
                                }
                                else {
                                    cb();
                                }
                            })
                        } else {
                            cb();
                        }
                    });
                },
                (err, n) => {
                    callback();
                }
            );
        }], (err, result) => {
            if (err) {
                log.e('An error occured while creating the backup.');
                callback(err); return;
            }
            else {
                callback(null, 'Backup completed sucessfully.')
            }
        })
}

module.exports = {
    backupDynamoDBToJSON: backupDynamoDBToJSON,
    backupDynamoDBToDynamoDB: backupDynamoDBToDynamoDB,
    backupDynamoDBToS3: backupDynamoDBToS3
}