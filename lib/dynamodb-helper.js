createTable = (AWS, param, callback) => {
    var dynamodb = new AWS.DynamoDB();
    dynamodb.createTable(param, (err, data) => {
        callback(err, data);
    })
}

listTables = (AWS, callback) => {
    var dynamodb = new AWS.DynamoDB();
    dynamodb.listTables({}, (err, data) => {
        callback(err, data);
    })
}

describeTable = (AWS, param, callback) => {
    var dynamodb = new AWS.DynamoDB();
    dynamodb.describeTable(param, (err, data) => {
        callback(err, data);
    })
}

listRecords = (param, callback) => {
    var dynamodb = new AWS.DynamoDB();
    dynamodb.scan(param, (err, data) => {
        callback(err, data);
    })
}



module.exports = {
    createTable: createTable,
    listTables: listTables,
    listRecords: listRecords,
    describeTable: describeTable,
}