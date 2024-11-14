// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ControlPlane, CognitoAuth } from "@cdklabs/sbt-aws";

interface ControlPlaneStackProps extends cdk.StackProps {
  readonly systemAdminRoleName: string;
  readonly systemAdminEmail: string;
}

export class SaaSControlPlaneStack extends cdk.Stack {
  public readonly controlPlane: ControlPlane;

  constructor(scope: Construct, id: string, props: ControlPlaneStackProps) {
    super(scope, id, props);

    const cognitoAuth = new CognitoAuth(this, "CognitoAuth", {      
      systemAdminRoleName: props.systemAdminRoleName,
      systemAdminEmail: props.systemAdminEmail,
    });

    const controlPlane = new ControlPlane(this, "ControlPlane", {
      auth: cognitoAuth,
    });
    this.controlPlane = controlPlane;

    new cdk.CfnOutput(this, 'ControlPlaneEventManager', {
      value: JSON.stringify({'busArn':controlPlane.eventManager.busArn, 'supportedEvents': controlPlane.eventManager.supportedEvents}),
      exportName: 'ControlPlaneEventManager'
    }
    );
  }
}
