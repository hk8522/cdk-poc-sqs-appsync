import * as AWS from 'aws-sdk';

interface AppsyncLambdaInvokeEvent {
  arguments: {
    bid: number;
    auctionId: string;
  };
}

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

export async function handler(event: AppsyncLambdaInvokeEvent) {
  console.log('EVENT ====>', event);

  const { auctionId } = event.arguments;

  await sqs
    .sendMessage({
      MessageGroupId: auctionId,
      MessageBody: JSON.stringify(event.arguments),
      QueueUrl: process.env.queueUrl as string,
    })
    .promise();

  return 'bid';
}
