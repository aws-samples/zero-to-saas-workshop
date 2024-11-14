import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NagSuppressions } from 'cdk-nag';

export class SaaSTenantProvisionStackNag extends Construct {
  constructor (scope: Construct, id: string) {
    super(scope, id);

    const nagPath = `/SaaSTenantProvisionStack/CoreApplicationPlane`;

    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      `${nagPath}/provisioning-codeBuildProvisionProjectRole/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Permission to describe and list stacks provided only for stacks created as part of workshop'
        }
      ]
    );
    
    NagSuppressions.addResourceSuppressionsByPath(
      cdk.Stack.of(this),
      `${nagPath}/provisioning-orchestrator/provisioningStateMachine/Role/DefaultPolicy/Resource`,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'Dependency - Not created as part of workshop stack'
        }
      ]
    );

  }
}