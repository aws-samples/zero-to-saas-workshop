// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export interface AuthorizationStackProps extends cdk.StackProps {
    authFunctionArn: string;
    userPoolArn: string
  }