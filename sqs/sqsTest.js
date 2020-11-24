// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'us-east-1'});
// Create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
let queueUrl = 'https://sqs.us-east-1.amazonaws.com/511376436002/sfl-offers-events.fifo'
var params = {
    AttributeNames: [
        "SentTimestamp"
    ],
    MaxNumberOfMessages: 10,
    MessageAttributeNames: [
        "All"
    ],
    QueueUrl: queueUrl,
    VisibilityTimeout: 20,
    WaitTimeSeconds: 0
};
const sqsProcess3 = async (param = '') => {

    sqs.receiveMessage(params, function(err, data) {
        if (err) {
            console.log("Receive Error", err);
        } else if (data.Messages) {
            console.log('data.Messages:',data.Messages)
            var deleteParams = {
                QueueUrl: queueUrl,
                ReceiptHandle: data.Messages[0].ReceiptHandle
            };

            return
            sqs.deleteMessage(deleteParams, function(err, data) {
                if (err) {
                    console.log("Delete Error", err);
                } else {
                    console.log("Message Deleted", data);
                }
            });
        }
    });

}



module.exports = {
    sqsProcess3,
}
