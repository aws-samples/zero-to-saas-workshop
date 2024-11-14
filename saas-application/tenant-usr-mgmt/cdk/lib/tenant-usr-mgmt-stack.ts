// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IdentityProvider } from './identity-provider';
import { ApiGateway } from './api-gateway';
import { Services } from './services';
import { LambdaAuthorizer } from './lambda-authorizer';
import { TenantUserManagementStackNag } from './cdknag/tenant-usr-mgmt-stack-nag';

interface TenantUserManagementStackProps extends StackProps{
    avpNamespace : string
    policyStoreId:string
}

export class TenantUserManagementStack extends Stack {

  public readonly userPoolArn: string;
  public readonly authorizerFunctionArn: string;

  constructor(scope: Construct, id: string, props: TenantUserManagementStackProps) {
    super(scope, id, props);
    
    const identityProvider = new IdentityProvider(this, 'IdentityProvider');

    this.userPoolArn = identityProvider.identityDetails.details['userPoolArn']

    const identityDetails = identityProvider.identityDetails

    
    const lambdaAuthorizer = new LambdaAuthorizer(this, "LambdaAuthorizer",{
      idpDetails: identityDetails,
      avpNamespace: props.avpNamespace,
      policyStoreId: props.policyStoreId
    });

    
    this.authorizerFunctionArn = lambdaAuthorizer.authorizerFunction.lambdaFunction.functionArn;

    const apiGateway = new ApiGateway(this, 'ApiGateway', {
      authFunction: lambdaAuthorizer
    });

    new Services(this, 'Services', {
      idpDetails: identityDetails,
      restApi: apiGateway.restApi
    });

    new CfnOutput(this, 'TenantIdpName', {
      value: identityProvider.identityDetails.name,
      exportName: 'TenantIdpName',
    });

    new CfnOutput(this, 'TenantUserpoolId', {
      value: identityProvider.identityDetails.details['userPoolId'],
      exportName: 'TenantUserpoolId',
    });

    new CfnOutput(this, 'TenantUserpoolArn', {
      value: identityProvider.identityDetails.details['userPoolArn'],
      exportName: 'TenantUserpoolArn',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: identityProvider.identityDetails.details['appClientId'],
      exportName: 'UserPoolClientId',
    });

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGateway.restApi.url,
      exportName: 'ApiGatewayUrl',
    });

    new CfnOutput(this, 'AuthorizerFunctionArn', {
      value: lambdaAuthorizer.authorizerFunction.lambdaFunction.functionArn,
      exportName: 'AuthorizerFunctionArn',
    });
    
    new TenantUserManagementStackNag(this, 'TenantUserManagementStackNag')
    
  }
}
