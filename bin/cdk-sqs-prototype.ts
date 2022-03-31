#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkSqsProtypeStack } from '../lib/cdk-sqs-prototype-stack';

const app = new cdk.App();
new CdkSqsProtypeStack(app, 'CdkSqsProtypeStack');
