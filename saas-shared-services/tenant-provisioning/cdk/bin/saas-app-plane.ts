#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SaaSTenantProvisionStack } from '../lib/saas-tenant-provision-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';
import {
  EventManager
} from "@cdklabs/sbt-aws";

const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

if (!process.env.CDK_PARAM_CONTROLPLANE_EVENT_MANAGER) {
  throw new Error('CDK_PARAM_CONTROLPLANE_EVENT_MANAGER is NULL');
}

if (!process.env.CDK_PARAM_TENANT_USERPOOL_ID) {
  throw new Error('CDK_PARAM_TENANT_USERPOOL_ID is NULL');
}

const eventManagerJson = process.env.CDK_PARAM_CONTROLPLANE_EVENT_MANAGER

const eventMgr: EventManager = JSON.parse(eventManagerJson)

new SaaSTenantProvisionStack(app, 'SaaSTenantProvisionStack',{
  eventBusArn : eventMgr.busArn,
  userPool: process.env.CDK_PARAM_TENANT_USERPOOL_ID
});
