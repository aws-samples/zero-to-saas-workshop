// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  AuthorizationType,
  IdentitySource,
  RestApi,
  RequestAuthorizer
} from 'aws-cdk-lib/aws-apigateway';
import { IdentityDetails } from '../interfaces/identity-details';
import { LambdaAuthorizer } from './lambda-authorizer';

interface ApiGatewayProps {
  authFunction : LambdaAuthorizer
}

export class ApiGateway extends Construct {
  public readonly restApi: RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.restApi = new RestApi(this, `TenantUserManagementAPI`, {
      defaultMethodOptions: {        
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: new RequestAuthorizer(this, 'TenantAPIAuthorizer', {
          handler: props.authFunction.authorizerFunction.lambdaFunction,
          identitySources: [IdentitySource.header('Authorization'),IdentitySource.context('httpMethod'),IdentitySource.context('path')],
          resultsCacheTtl: Duration.seconds(30),
        }),
      },
     /* defaultCorsPreflightOptions: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },*/
    }); 
  }
}
