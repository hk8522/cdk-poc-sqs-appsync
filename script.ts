import { AWSAppSyncClient, AUTH_TYPE } from "aws-appsync";
import * as AWS from "aws-sdk";
import { gql } from "graphql-tag";
import "cross-fetch/polyfill";
import "websocket-polyfill";

let appSyncClient: AWSAppSyncClient<any>;

// create 10 bids for auction 1
const auction1 = "93b0a562-b5b0-4970-ad64-f2fe12aacb61";

const start: { [key: string]: number } = {};

async function placeBid(limit: number, auction: string): Promise<void> {
  for (let i = 1; i <= limit; i++) {
    const bid = randomBid();
    start[i] = new Date().getTime();
    const resp = await makeRequest(auction, bid);
    console.log(`Time for get ${i}: ${new Date().getTime() - start[i]} ms`);
  }
}

const randomBid = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

async function makeRequest(auctionId: string, bid: number): Promise<any> {
  const placeBidMutation = gql`
    mutation placeBid($auctionId: ID!, $bid: Int!) {
      placeBid(auctionId: $auctionId, bid: $bid)
    }
  `;

  return (
    await appSyncClient.mutate({
      mutation: placeBidMutation,
      variables: {
        auctionId,
        bid,
      },
    })
  ).data;
}

function subscribe(auctionId: string): void {
  const subscription = gql`
    subscription bidCompleteSubscription($auctionId: ID!) {
      bidCompleteSubscription(auctionId: $auctionId) {
        auctionId
        bid
      }
    }
  `;

  const result = appSyncClient.subscribe({
    query: subscription,
    variables: {
      auctionId,
    },
    fetchPolicy: "no-cache",
  });

  let i = 1;
  result.subscribe((item) => {
    console.log(
      `Time for subscription ${i}: ${new Date().getTime() - start[i]} ms`
    );
    i++;
  });
}

void (async function () {
  appSyncClient = new AWSAppSyncClient({
    url: "https://bvutgcbaivep3l7c6kyxcitplq.appsync-api.eu-central-1.amazonaws.com/graphql",
    region: "eu-central-1",

    auth: {
      type: AUTH_TYPE.API_KEY,
      apiKey: "da2-r4zow3ri3rcpvjv4rwvdxvf4nq",
    },

    disableOffline: true,
  });

  appSyncClient = await appSyncClient.hydrated();
  subscribe(auction1);
  await placeBid(5, auction1);
})();
