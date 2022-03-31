import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as path from 'path';
import * as sqs from '@aws-cdk/aws-sqs';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import * as appsync from '@aws-cdk/aws-appsync';
import { AppSyncTransformer } from 'cdk-appsync-transformer';

export class CdkSqsProtypeStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bidQueue = new sqs.Queue(this, 'bidQueue', {
      queueName: 'bidQueue.fifo',
      contentBasedDeduplication: true,
      fifo: true,
    });

    // CREATE THE APPSYNC API
    const appsyncTransformer = new AppSyncTransformer(
      this,
      'CDKAmplifyProject',
      {
        schemaPath: 'graphql/schema.graphql',
        authorizationConfig: {
          defaultAuthorization: {
            authorizationType: appsync.AuthorizationType.API_KEY,
          },
        },
      }
    );

    console.log('TABLE NAME', appsyncTransformer.tableNameMap.AuctionTable)
    const bidProcessor = new lambda.NodejsFunction(this, 'bidProcessor', {
      entry: path.resolve(__dirname, '../src/consumer-one.ts'), // accepts .js, .jsx, .ts and .tsx files
      functionName: 'bidProcessor',
      handler: 'handler',
      timeout: cdk.Duration.seconds(10),
      environment: {
          AUCTIONS_TABLE_NAME: appsyncTransformer.tableNameMap.AuctionTable,
          APPSYNC_URL: appsyncTransformer.appsyncAPI.graphqlUrl,
          APPSYNC_API_KEY: appsyncTransformer.appsyncAPI.apiKey as string,
      },
      bundling: {
        target: 'es2020', // target environment for the generated JavaScript code,
        environment: {
          AUCTIONS_TABLE_NAME: appsyncTransformer.tableNameMap.AuctionTable,
          APPSYNC_URL: appsyncTransformer.appsyncAPI.graphqlUrl,
          APPSYNC_API_KEY: appsyncTransformer.appsyncAPI.apiKey as string,
        },
      },
    });

    // const bidProcess2 = new lambda.NodejsFunction(this, 'bidProcess2', {
    //   entry: path.resolve(__dirname, '../src/consumer-two.ts'), // accepts .js, .jsx, .ts and .tsx files
    //   functionName: 'bidProcess2',
    //   handler: 'handler',
    //   timeout: cdk.Duration.seconds(10),
    //   bundling: {
    //     target: 'es2020', // target environment for the generated JavaScript code
    //   },
    //   environment: {
    //     AUCTIONS_TABLE_NAME: appsyncTransformer.tableNameMap.AuctionTable,
    //     APPSYNC_URL: appsyncTransformer.appsyncAPI.graphqlUrl,
    //     APPSYNC_API_KEY: appsyncTransformer.appsyncAPI.apiKey as string
    //   }
    // });

    const placeBid = new lambda.NodejsFunction(this, 'placeBid', {
      entry: path.resolve(__dirname, '../src/placeBid.ts'), // accepts .js, .jsx, .ts and .tsx files
      functionName: 'placeBid',
      handler: 'handler',
      timeout: cdk.Duration.seconds(10),
      bundling: {
        target: 'es2020', // target environment for the generated JavaScript code
      },
      environment: {
        queueUrl: bidQueue.queueUrl,
      },
    });

    bidProcessor.addEventSource(new SqsEventSource(bidQueue));
    bidProcessor.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
    );
    // bidProcess2.addEventSource(new SqsEventSource(bidQueue));
    // bidProcess2.role?.addManagedPolicy(
    //   iam.ManagedPolicy.fromAwsManagedPolicyName(
    //     'AmazonDynamoDBFullAccess',
    //   )
    // )
    bidQueue.grantSendMessages(placeBid);

    appsyncTransformer.addLambdaDataSourceAndResolvers(
      'placeBid',
      'placeBid',
      placeBid,
      {
        name: 'placeBid',
      }
    );
  }
}
