#!/usr/bin/env node

const argv = require('yargs').argv;
const AWS = require('aws-sdk');
const dynamoDBHelper = require('../lib/dynamodb-helper.js')
const log = require('../lib/log-helper.js')
const backupHelper = require('../lib/backup-helper.js')

var args = {
    config: '',
    command: ['listtables', 'listrecords', 'describe', 'backup'],
}

try {
    if (argv.config && argv.config.endsWith('.json')) {
        var config = require(argv.config.replace('\\', '/'));
        log.i("Config : ", config);
        if (argv.command && args.command.indexOf(argv.command) >= 0) {
            if (config.source.aws)
                AWS.config.update(config.source.aws);
            var command = argv.command;
            switch (argv.command) {
                case 'listtables':
                    dynamoDBHelper.listTables(AWS, (err, data) => {
                        if (err)
                            log.e(err);
                        log.i(data);
                    })
                    break;
                case 'describe':
                    var param = { TableName: config.source.TableName }
                    dynamoDBHelper.describeTable(AWS, param, (err, data) => {
                        if (err)
                            log.e(err);
                        log.i(JSON.stringify(data));
                    })
                    break;
                case 'backup':
                    if (config.target) {
                        if (config.target.type) {
                            switch (config.target.type) {
                                case 'json':
                                    backupHelper.backupDynamoDBToJSON(config.source, config.target, (err, result) => {
                                        if (err)
                                            log.e(err);
                                        log.i(result);
                                    })
                                    break;
                                case 'dynamoDB':
                                    backupHelper.backupDynamoDBToDynamoDB(config.source, config.target, (err, result) => {
                                        if (err)
                                            log.e(err);
                                        log.i(result);
                                    })
                                    break;
                                default:
                                    break;
                            }
                        }
                        else
                            log.e('Target type not defined in the config');
                    }
                    else
                        log.e('Target not defined in the config');
                    break;
                default:
                    break;
            }

        }
        else {
            log.i(args.command.indexOf(argv.command));
            log.e('Invalid or no command passed')
        }
    }
    else {
        log.e('Invalid or no config file passed')

    }
} catch (error) {
    log.e(error);
}

