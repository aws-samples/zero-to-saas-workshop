// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_dynamodb, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaFunction } from './lambda-function';
import * as aws_apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";

interface MicroserviceProps {
  index: string;
  serviceName: string;
  entry: string;
  sortKey: string;
  apiGatewayResource: aws_apigateway.Resource;
  handlers: {
    create: string;
    get: string;
    getAll: string;
    update: string;
    delete: string;
  };
  logLevel: string;
  layers?: lambda.LayerVersion[];
  logGroup: logs.LogGroup
}

export class Microservice extends Construct {
  public readonly table: aws_dynamodb.Table;
  constructor(scope: Construct, id: string, props: MicroserviceProps) {
    super(scope, id);

    const powertoolsNamespace = 'SERVERLESS_SAAS'
    const idResource = props.apiGatewayResource.addResource('{id}');

    this.table = new aws_dynamodb.Table(this, 'Table', {
      billingMode: aws_dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      tableName: props.serviceName.concat('-pooled'),
      partitionKey: {
        name: 'shardId',
        type: aws_dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: props.sortKey,
        type: aws_dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY
    });

    const getLambdaFunctionConstruct = new LambdaFunction(this, 'GetFunction', {
      entry: props.entry,
      handler: props.handlers.get,
      index: props.index,
      powertoolsServiceName: props.serviceName,      
      powertoolsNamespace: powertoolsNamespace,
      logLevel: props.logLevel,
      layers: props.layers,
      logGroup: props.logGroup
    });

    getLambdaFunctionConstruct.lambdaFunction.addEnvironment('TABLE_NAME', this.table.tableName);

    idResource.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(getLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantReadData(getLambdaFunctionConstruct.lambdaFunction);

    const getAllLambdaFunctionConstruct = new LambdaFunction(this, 'GetAllFunction', {
      entry: props.entry,
      handler: props.handlers.getAll,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      powertoolsNamespace: powertoolsNamespace,
      logLevel: props.logLevel,
      layers: props.layers,
      logGroup: props.logGroup
    });
    props.apiGatewayResource.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(getAllLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    getAllLambdaFunctionConstruct.lambdaFunction.addEnvironment('TABLE_NAME', this.table.tableName);
    this.table.grantReadData(getAllLambdaFunctionConstruct.lambdaFunction);

    const createLambdaFunctionConstruct = new LambdaFunction(this, 'CreateFunction', {
      entry: props.entry,
      handler: props.handlers.create,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      powertoolsNamespace: powertoolsNamespace,
      logLevel: props.logLevel,
      layers: props.layers,
      logGroup: props.logGroup
    });
    props.apiGatewayResource.addMethod(
      'POST',
      new aws_apigateway.LambdaIntegration(createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(createLambdaFunctionConstruct.lambdaFunction);
    createLambdaFunctionConstruct.lambdaFunction.addEnvironment('TABLE_NAME', this.table.tableName);

    const updateLambdaFunctionConstruct = new LambdaFunction(this, 'UpdateFunction', {
      entry: props.entry,
      handler: props.handlers.update,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      powertoolsNamespace: powertoolsNamespace,
      logLevel: props.logLevel,
      layers: props.layers,
      logGroup: props.logGroup
    });
    idResource.addMethod(
      'PUT',
      new aws_apigateway.LambdaIntegration(createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(updateLambdaFunctionConstruct.lambdaFunction);
    updateLambdaFunctionConstruct.lambdaFunction.addEnvironment('TABLE_NAME', this.table.tableName);

    const deleteLambdaFunctionConstruct = new LambdaFunction(this, 'DeleteFunction', {
      entry: props.entry,
      handler: props.handlers.delete,
      index: props.index,
      powertoolsServiceName: props.serviceName,
      powertoolsNamespace: powertoolsNamespace,
      logLevel: props.logLevel,
      layers: props.layers,
      logGroup: props.logGroup
    });
    idResource.addMethod(
      'DELETE',
      new aws_apigateway.LambdaIntegration(createLambdaFunctionConstruct.lambdaFunction, {
        proxy: true,
      })
    );
    this.table.grantWriteData(deleteLambdaFunctionConstruct.lambdaFunction);
    deleteLambdaFunctionConstruct.lambdaFunction.addEnvironment('TABLE_NAME', this.table.tableName);
  }
}
