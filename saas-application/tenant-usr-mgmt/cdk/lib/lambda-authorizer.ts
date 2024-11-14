// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Fn, Stack,aws_iam } from 'aws-cdk-lib';
import  {Construct} from 'constructs'
import { LambdaFunction } from './lambda-function';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { IdentityDetails } from '../interfaces/identity-details';

interface LambdaAuthorizerProps {
  idpDetails: IdentityDetails;
  avpNamespace: string;
  policyStoreId: string;

}

export class LambdaAuthorizer extends Construct{

    public readonly authorizerFunction: LambdaFunction;

    constructor(scope: Construct, id: string, props: LambdaAuthorizerProps) {
        super(scope, id);
    
        const authFunction = new LambdaFunction(this, 'AuthorizerFunction', {
            entry: path.join(__dirname, '../../src'),
            handler: 'lambda_handler',
            index: 'tenant_authorizer.py',
            powertoolsServiceName: 'AUTHORIZER',      
            powertoolsNamespace: 'AppPlane',
            logLevel: 'DEBUG',      
          });

          authFunction.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: 
            ['cognito-idp:ListGroups',
             'cognito-idp:ListIdentityProviders',
             'cognito-idp:ListResourceServers',
             'cognito-idp:ListResourcesForWebACL',
             'cognito-idp:ListUserPoolClients',
             'cognito-idp:ListUserPools',
             'cognito-idp:ListUsers',
             'cognito-idp:ListUsersInGroup'],
            resources: [`${props.idpDetails.details.userPoolArn}`]
          }));
      
          authFunction.lambdaFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['verifiedpermissions:IsAuthorizedWithToken'],
            resources: [`arn:aws:verifiedpermissions::${Stack.of(this).account}:policy-store/${props.policyStoreId}`]
          }));
      
          authFunction.lambdaFunction.addEnvironment('IDP_DETAILS', JSON.stringify(props.idpDetails))

          if (!authFunction.lambdaFunction.role?.roleArn) {
            throw new Error('AuthorizerFunction roleArn is undefined');
          }
          
          authFunction.lambdaFunction.addEnvironment(
            'AVP_NAMESPACE',
            props.avpNamespace,
          );

          authFunction.lambdaFunction.addEnvironment(
            'POLICY_STORE_ID',
            props.policyStoreId,
          );
        

          this.authorizerFunction = authFunction;

        }
}