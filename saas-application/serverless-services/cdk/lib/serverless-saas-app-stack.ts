// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, CfnOutput, Fn, aws_iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from './api-gateway';
import { Services } from './services';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { ServerlessSaaSAppStackNag } from './cdknag/serverless-saas-app-stack-nag';

export class ServerlessSaaSAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // Values imported from the tenant manamgent microservice
    const identityDetails = {
      name: Fn.importValue('TenantIdpName'),
      details: {
        userPoolId: Fn.importValue('TenantUserpoolId'),
        appClientId: Fn.importValue('TenantUserpoolId'),
      }
    }

    const authorizerFunctionArn = Fn.importValue('AuthorizerFunctionArn')

    const apiGateway = new ApiGateway(this, 'ApiGateway', {
      idpDetails: identityDetails,    
      authorizerFunctionArn: authorizerFunctionArn,
    });

    const services = new Services(this, 'Services', {
      idpDetails: identityDetails,
      restApi: apiGateway.restApi
    });

    new CfnOutput(this, 'ApiGatewayUrl', {
      value: apiGateway.restApi.url,
    });

    new CfnOutput(this, 'ProductTableName', {
      value: services.productMicroservice.table.tableName,
    });

    new CfnOutput(this, 'OrderTableName', {
      value: services.orderMicroservice.table.tableName,
    });

    new CfnOutput(this, 'AccessLogArn', {
      value: apiGateway.restAPIAccessLogGroup.logGroupArn,
      exportName: 'ServerlessSaaSAPIAccessLogArn',
    });

    new CfnOutput(this, 'AccessLogName', {
      value: apiGateway.restAPIAccessLogGroup.logGroupName,
      exportName: 'ServerlessSaaSAPIAccessLogName',
    });

    new ServerlessSaaSAppStackNag(this, 'ServerlessSaaSAppStackNag')
  }

  ssmLookup(parameterName: string) {
    return StringParameter.valueForStringParameter(this, parameterName);
  }
}
