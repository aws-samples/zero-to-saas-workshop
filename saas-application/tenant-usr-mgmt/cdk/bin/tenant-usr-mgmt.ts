#!/usr/bin/env node

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TenantUserManagementStack } from '../lib/tenant-usr-mgmt-stack';
import { TenantAuthorizationStack } from '../lib/tenant-authorization-stack';
import { AwsSolutionsChecks } from 'cdk-nag'
import { Aspects } from 'aws-cdk-lib';

const app = new cdk.App();

Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

new TenantUserManagementStack(app, 'TenantUserManagementStack', 
  {avpNamespace:String(process.env.CDK_PARAM_AVP_NAMESPACE), policyStoreId:String(process.env.CDK_PARAM_AVP_STORE_ID)});


new TenantAuthorizationStack(app, 'TenantAuthorizationStack', {});