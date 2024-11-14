import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export class ServerlessSaaSAppStackNag extends Construct {
  constructor (scope: Construct, id: string) {
    super(scope, id);

    const nagPath = `/SaaSTenantProvisionStack/CoreApplicationPlane`;

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(this),    
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'AWS managed policies used'
        }
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(this),    
      [
        {
          id: 'AwsSolutions-L1',
          reason: 'Pthon 3.10 used.'
        }
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(this),    
      [
        {
          id: 'AwsSolutions-APIG2',
          reason: 'Malformed request payload resulting in invalid data stored in DB, failure from application services is an acceptable behaviour for this workshop'
        }
      ],
      true
    );    

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(this),    
      [
        {
          id: 'AwsSolutions-COG4',
          reason: 'API GW method does not use a Cognito user pool authorizer - Custom Authorizer used'
        }
      ],
      true
    );

    NagSuppressions.addResourceSuppressions(
      cdk.Stack.of(this),    
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Default wild card policy created by PythonFunction (@aws-cdk/aws-lambda-python-alpha)'
        }
      ],
      true
    );


  }
}