// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import {Stack, StackProps,region_info} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SaaSTenantProvisionStackNag } from './cdknag/saas-tenant-provision-stack-nag';
import {
  CoreApplicationPlane,
  DetailType,
  IEventManager,
  EventManager
} from "@cdklabs/sbt-aws";
import { EventBus } from 'aws-cdk-lib/aws-events';

import { PolicyDocument } from "aws-cdk-lib/aws-iam";
import * as fs from "fs";


interface SaaSTenantProvisionStackProps extends StackProps {
  eventBusArn: string,
  userPool: string
}
export class SaaSTenantProvisionStack extends Stack {
  constructor(scope: Construct, id: string, props: SaaSTenantProvisionStackProps) {
    super(scope, id, props);

    const eventBusArn = props.eventBusArn;
    const userPoolId  = props.userPool;

    const provisioningJobRunnerProps = {
      name: "provisioning",
      permissions: PolicyDocument.fromJson(
        JSON.parse(`
          {
            "Version":"2012-10-17",
            "Statement":[
                {
                  "Action":[
                      "cloudformation:DescribeStacks",
                      "cloudformation:ListStacks"
                  ],
                  "Resource":"arn:aws:cloudformation:${Stack.of(this).region}:${Stack.of(this).account}:stack/TenantUserManagementStack/*",
                  "Effect":"Allow"
                },
                {
                  "Action":[
                      "cognito-idp:AdminCreateUser",
                      "cognito-idp:AdminSetUserPassword"
                  ],
                  "Resource":"arn:aws:cognito-idp:${Stack.of(this).region}:${Stack.of(this).account}:userpool/${userPoolId}",       
                  "Effect":"Allow"
                }
            ]
          }
          `)
      ),
      script: fs.readFileSync("../../../scripts/provision-tenant.sh", "utf8"),
      environmentJSONVariablesFromIncomingEvent: [
        "tenantId",
        "tenantName",
        "email",
        "tenantStatus",
        "tier"
      ],
      environmentVariablesToOutgoingEvent: ["tenantStatus"],
      scriptEnvironmentVariables: {},
      outgoingEvent: DetailType.PROVISION_SUCCESS,
      incomingEvent: DetailType.ONBOARDING_REQUEST,
    };

    const eventBus = EventBus.fromEventBusArn(this, 'EventBus', eventBusArn);
    
    const eventManagerNew = new EventManager(this, 'EventManager', {
      eventBus: eventBus
    });

    new CoreApplicationPlane(this, "CoreApplicationPlane", {
      eventManager: eventManagerNew,
      jobRunnerPropsList: [provisioningJobRunnerProps],
    });

    new SaaSTenantProvisionStackNag(this, 'SaaSTenantProvisionStackNag')
  }
}


