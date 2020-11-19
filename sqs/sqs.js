const config = require('plain-config')()

let AWS = require('aws-sdk')
let sqs = new AWS.SQS({
    accessKeyId: config.aws.key,
    secretAccessKey: config.aws.access_key,
    region: config.aws.region
});

let queueUrl = 'https://sqs.us-east-1.amazonaws.com/511376436002/sfl-offers-events-stagin.fifo'

const receiveMessage = async () => {
    return sqs.receiveMessage({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
        MaxNumberOfMessages: 10,
        VisibilityTimeout: 10,
        WaitTimeSeconds: 20
    }).promise()
        .then(data => {
            return data
        })
        .catch(err => {
            console.log("Error while fetching messages from the sqs queue", err)
        })
}

module.exports = {
    receiveMessage,
}