getAWS = (awsCred) => {
    var AWS = require('aws-sdk');
    if (awsCred)
        AWS.config.update(awsCred)
    return AWS;
}

getDynamoDBClient = (awsCred) => {
    var AWS = getAWS(awsCred);
    return new AWS.DynamoDB();
}

getS3Client = (awsCred) => {
    var AWS = getAWS(awsCred);
    return new AWS.S3();
}

module.exports = {
    getAWS: getAWS,
    getDynamoDBClient: getDynamoDBClient,
    getS3Client: getS3Client
}