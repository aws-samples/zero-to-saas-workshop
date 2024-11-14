#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SaaSControlPlaneStack } from '../lib/saas-control-plane-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

// required input parameters
if (!process.env.CDK_PARAM_SYSTEM_ADMIN_EMAIL) {
  throw new Error("Please provide system admin email");
}

if (!process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME) {
  process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME = "SystemAdmin";
}

new SaaSControlPlaneStack(app, 'SaaSControlPlaneStack', {
  systemAdminRoleName: process.env.CDK_PARAM_SYSTEM_ADMIN_ROLE_NAME,
  systemAdminEmail: process.env.CDK_PARAM_SYSTEM_ADMIN_EMAIL,
});