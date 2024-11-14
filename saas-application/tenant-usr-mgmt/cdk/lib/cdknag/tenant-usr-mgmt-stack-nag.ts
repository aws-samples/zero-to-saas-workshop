import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export class TenantUserManagementStackNag extends Construct {
  constructor (scope: Construct, id: string) {
    super(scope, id);

    const nagPath = `/SaaSTenantProvisionStack/CoreApplicationPlane`;

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      `/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/DeploymentStage.prod/Resource`,
      [
        {
          id: 'AwsSolutions-APIG1',
          reason: 'Access logging at API gateway not required for this workshop. CloudWatch logs enabled at application services'
        },
        {
          id: 'AwsSolutions-APIG6',
          reason: 'CloudWatch logging at API gateway not required for this workshop. CloudWatch logs enabled at application services'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/LambdaAuthorizer/AuthorizerFunction/lambdaFunction/ServiceRole/Resource`,
        `/TenantUserManagementStack/Services/AppPlaneUserManagementServices/lambdaFunction/ServiceRole/Resource`
      ],      
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'AWS managed policies used'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Resource`
      ],      
      [
        {
          id: 'AwsSolutions-APIG2',
          reason: 'Malformed request payload resulting in invalid data stored in DB, failure from application services is an acceptable behaviour for this workshop'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/LambdaAuthorizer/AuthorizerFunction/lambdaFunction/ServiceRole/DefaultPolicy/Resource`,
        `/TenantUserManagementStack/Services/AppPlaneUserManagementServices/lambdaFunction/ServiceRole/DefaultPolicy/Resource`
      ],
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Default wild card policy created by PythonFunction (@aws-cdk/aws-lambda-python-alpha)'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/LambdaAuthorizer/AuthorizerFunction/lambdaFunction/Resource`,
        `/TenantUserManagementStack/Services/AppPlaneUserManagementServices/lambdaFunction/Resource`
      ],
      [
        {
          id: 'AwsSolutions-L1',
          reason: 'Pthon 3.10 used.'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Resource`],
      [
        {
          id: 'AwsSolutions-APIG2',
          reason: 'Malformed request payload resulting in invalid data stored in DB, failure from application services is an acceptable behaviour for this workshop'
        }
      ]
    );

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      [`/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Default/users/POST/Resource`,
      `/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Default/users/GET/Resource`,
      `/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Default/users/{username}/GET/Resource`,
      `/TenantUserManagementStack/ApiGateway/TenantUserManagementAPI/Default/users/{username}/PUT/Resource`
      ],
      [
        {
          id: 'AwsSolutions-COG4',
          reason: 'API GW method does not use a Cognito user pool authorizer - Custom Authorizer used'
        }
      ]
    );

  }
}