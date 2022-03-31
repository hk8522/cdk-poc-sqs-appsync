import { SQSEvent } from "aws-lambda";
import * as AWS from "aws-sdk";
const fetch = require('node-fetch');

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function handler(event: SQSEvent) {
  console.log('event :point_right:', event.Records);

  for (const item of event.Records) {
    console.log('MESSAGE GROUP ID', item.attributes.MessageGroupId);

    const body: { bid: number, auctionId: string } = JSON.parse(item.body);

    const auction: any = await getAuctionById(body.auctionId);
    console.log("getAuctionById", auction);

    const resp = await makeRequest(auction.id);
    const respJson = await resp.json();
    console.log("respJson", respJson);

    return auction

  }
  return {
    body: JSON.stringify({ message: 'Successful lambda invocation' }),
    statusCode: 200,
  };
}

async function getAuctionById(id: string) {
  let auction;

  try {
    const result = await dynamodb
      .get({
        TableName: process.env.AUCTIONS_TABLE_NAME as string,
        Key: { id },
      })
      .promise();

    auction = result.Item;
  } catch (error) {
    console.error(error);
  }

  if (!auction) {
    throw new Error(`Auction with ID "${id}" not found !`);
  }

  return auction;
}

const makeRequest = (auctionId: string) => {

  const bidCompleteMutation = `mutation bidComplete($auctionId: ID!) {
    bidComplete(auctionId: $auctionId) {
        auctionId
      }
    }`;

  return fetch(process.env.APPSYNC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.APPSYNC_API_KEY,
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: bidCompleteMutation,
      variables: {
        auctionId
      }
    })
  })
}