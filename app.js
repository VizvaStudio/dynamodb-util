module.exports = {
    "helper": require('./lib/dynamodb-helper.js'),
    "replication": require('./bin/dynamodb-rep.js'), 
    "backup": require('./lib/backup-helper.js')
}