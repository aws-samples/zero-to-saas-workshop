// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Duration, RemovalPolicy, Arn,aws_iam,aws_apigateway as apigateway } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, CfnPermission } from 'aws-cdk-lib/aws-lambda';
import {
  AuthorizationType,
  IdentitySource,
  RestApi,
  RequestAuthorizer,
  LogGroupLogDestination,
  AccessLogFormat,
  MethodLoggingLevel
} from 'aws-cdk-lib/aws-apigateway';

import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import { IdentityDetails } from '../interfaces/identity-details';

interface ApiGatewayProps {
  idpDetails: IdentityDetails;
  authorizerFunctionArn: string
}

export class ApiGateway extends Construct {
  public readonly restApi: RestApi;
  public readonly restAPIAccessLogGroup: LogGroup;
  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const role = new aws_iam.Role(this, 'APIGatewayCloudWatchRole', {
      assumedBy: new aws_iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs')],
    });

    new apigateway.CfnAccount(this, 'APIGatewayCfnAccount', /* all optional props */ {
      cloudWatchRoleArn: role.roleArn,
    });

    const authorizer_function_arn = props.authorizerFunctionArn

    const authorizerFunction = Function.fromFunctionArn(
      this,
      "AuthorizerFunction",
      authorizer_function_arn
    );

    this.restAPIAccessLogGroup = new LogGroup(this, 'APIGatewayAccessLogs', {
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_WEEK,
    });

    const tokenAuthorizer = new RequestAuthorizer(this, 'TenantAPIAuthorizer', {
      handler: authorizerFunction,
      identitySources: [IdentitySource.header('Authorization'),IdentitySource.context('httpMethod'),IdentitySource.context('path')],
      resultsCacheTtl: Duration.seconds(30),
    })


    this.restApi = new RestApi(this, `TenantServerlessSaaSAPI`, {
      defaultMethodOptions: {        
        authorizationType: AuthorizationType.CUSTOM,
        authorizer: tokenAuthorizer,
      },
      /*defaultCorsPreflightOptions: {
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
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(this.restAPIAccessLogGroup),
        accessLogFormat: AccessLogFormat.custom(
          '{"tenantId":"$context.authorizer.tenantId", "responseLatency":"$context.responseLatency", "requestId":"$context.requestId", \
          "ip":"$context.identity.sourceIp", "requestTime":"$context.requestTime", "httpMethod":"$context.httpMethod", \
          "routeKey":"$context.routeKey", "status":"$context.status", "protocol":"$context.protocol", \
          "responseLength":"$context.responseLength", "resourcePath":"$context.resourcePath"}'),        

        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
    });    

    new CfnPermission(this, 'AuthorizerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: authorizerFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: tokenAuthorizer.authorizerArn
    })       
  }
}