// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as path from 'path';
import {
  IRole,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Microservice } from './crud-microservice';
import { IdentityDetails } from '../interfaces/identity-details';
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from "aws-cdk-lib/aws-logs";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";

export interface ServicesProps {
  idpDetails: IdentityDetails;
  restApi: RestApi;
}

export class Services extends Construct {
  public readonly productMicroservice: Microservice;
  public readonly orderMicroservice: Microservice;
  public readonly promotionMicroservice: Microservice;

  constructor(scope: Construct, id: string, props: ServicesProps) {
    super(scope, id);

    const productMicroserviceResource = props.restApi.root.addResource('products');
    const orderMicroserviceResource = props.restApi.root.addResource('orders');
    const promotionMicroserviceResource = props.restApi.root.addResource('promotions');

    const telemetryAPIExtension = new lambda.LayerVersion(this, 'telemetry-api-extension', {
      layerVersionName: 'python-telemetry-api',
      code: lambda.Code.fromAsset(__dirname + '../../../src/extensions/telemetry-api/extension.zip'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_10],
      description: 'Telemetry API Extension for emitting tenant aware platform report.'
    });

    const serverlessServicesLogGroup = new logs.LogGroup(this, 'ServerlessServiceLogGroup', {
      logGroupName: 'serverless-services-log-group',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY
    });
    
    new CfnOutput(this, 'ServerlessServiceLogGroupArn', {
      value: serverlessServicesLogGroup.logGroupArn,
      exportName: 'ServerlessServiceLogGroup',
    });

    this.productMicroservice = new Microservice(this, 'ProductMicroservice', {
      index: 'product_service.py',
      serviceName: 'ProductService',
      entry: path.join(__dirname, '../../src'),
      sortKey: 'productId',
      apiGatewayResource: productMicroserviceResource,
      handlers: {
        getAll: 'get_products',
        create: 'create_product',
        get: 'get_product',
        update: 'update_product',
        delete: 'delete_product',
      },
      logLevel: 'DEBUG',
      layers: [telemetryAPIExtension],
      logGroup: serverlessServicesLogGroup
    });

    this.orderMicroservice = new Microservice(this, 'OrderMicroservice', {
      index: 'order_service.py',
      handlers: {
        getAll: 'get_orders',
        create: 'create_order',
        get: 'get_order',
        update: 'update_order',
        delete: 'delete_order'
      },
      serviceName: 'OrderService',
      entry: path.join(__dirname, '../../src'),
      sortKey: 'orderId',
      apiGatewayResource: orderMicroserviceResource,
      logLevel: 'DEBUG',
      layers: [telemetryAPIExtension],
      logGroup: serverlessServicesLogGroup
    });

    this.promotionMicroservice = new Microservice(this, 'PromotionMicroservice', {
      index: 'promotion_service.py',
      handlers: {
        getAll: 'get_promotions',
        create: 'create_promotion',
        get: 'get_promotion',
        update: 'update_promotion',
        delete: 'delete_promotion'
      },
      serviceName: 'PromotionService',
      entry: path.join(__dirname, '../../src'),
      sortKey: 'promotionId',
      apiGatewayResource: promotionMicroserviceResource,
      logLevel: 'DEBUG',
      layers: [telemetryAPIExtension],
      logGroup: serverlessServicesLogGroup
    });
  }
}
