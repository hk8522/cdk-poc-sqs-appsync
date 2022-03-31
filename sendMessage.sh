#!/bin/bash
set -e
export QUEUE_URL=`aws sqs get-queue-url --queue-name bidQueue.fifo --query 'QueueUrl' --output text --profile=h24 --region=us-east-1`
# QUEUE_URL=$(aws sqs create-queue --queue-name test.fifo --attributes FifoQueue=true,ContentBasedDeduplication=true --query QueueUrl --output text)
echo "Created SQS FIFO queue $QUEUE_URL"
echo "Sending 10 messages to queue with groupid A"
aws sqs send-message --message-body "Message C3" --message-group-id A --queue-url ${QUEUE_URL} --profile=h24 --region=us-east-1 
aws sqs send-message --message-body "Message D2" --message-group-id B --queue-url ${QUEUE_URL} --profile=h24 --region=us-east-1 
aws sqs send-message --message-body "Message D3" --message-group-id B --queue-url ${QUEUE_URL} --profile=h24 --region=us-east-1 

