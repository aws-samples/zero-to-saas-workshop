// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Duration, Aws } from 'aws-cdk-lib';
import {
  PolicyStatement,
  ManagedPolicy,
  Role,
  ServicePrincipal,
  Effect,  
} from 'aws-cdk-lib/aws-iam';
import { Runtime, Function, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { RestApi, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IdentityDetails } from '../interfaces/identity-details';
import { LambdaFunction } from './lambda-function';

export interface ServicesProps {
  idpDetails: IdentityDetails;
  restApi: RestApi;
}

export class Services extends Construct {
 
  constructor(scope: Construct, id: string, props: ServicesProps) {
    super(scope, id);

    const users = props.restApi.root.addResource('users');   

    const userManagementServices = new LambdaFunction(this, 'AppPlaneUserManagementServices', {
      entry: path.join(__dirname, '../../src'),
      handler: 'lambda_handler',
      index: 'user_management.py',
      powertoolsServiceName: 'USER_MANAGEMENT_SERVICE',      
      powertoolsNamespace: 'AppPlane',
      logLevel: 'DEBUG',      
    });
    userManagementServices.lambdaFunction.addEnvironment('IDP_DETAILS', JSON.stringify(props.idpDetails))

    if (props.idpDetails.name == 'Cognito') {
      userManagementServices.lambdaFunction.addToRolePolicy(
        new PolicyStatement({
          actions: [
            'cognito-idp:AdminDeleteUser',
            'cognito-idp:AdminEnableUser',
            'cognito-idp:AdminCreateUser',
            'cognito-idp:CreateGroup',
            'cognito-idp:AdminDisableUser',
            'cognito-idp:AdminAddUserToGroup',
            'cognito-idp:GetGroup',
            'cognito-idp:AdminUpdateUserAttributes',
            'cognito-idp:AdminGetUser',
            'cognito-idp:ListUsers',
            'cognito-idp:ListUsersInGroup',
            'cognito-idp:AdminListGroupsForUser',
          ],
          effect: Effect.ALLOW,
          resources: [
            `arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/${props.idpDetails.details.userPoolId}`,
          ],
        })
      )
    }
    
    users.addMethod('POST', new LambdaIntegration(userManagementServices.lambdaFunction));
    users.addMethod('GET', new LambdaIntegration(userManagementServices.lambdaFunction));
    const userNameResource = users.addResource('{username}');
    userNameResource.addMethod('GET', new LambdaIntegration(userManagementServices.lambdaFunction));
    userNameResource.addMethod('PUT', new LambdaIntegration(userManagementServices.lambdaFunction));
  }
}