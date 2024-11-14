// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CfnOutput, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AvpPolicyStore } from './policy-store';


export class TenantAuthorizationStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
      super(scope, id, props);

        const avp = new AvpPolicyStore(this,"AvpPolicyStore",{
            userPoolArn: Fn.importValue("TenantUserpoolArn"),
            authFunctionArn: Fn.importValue("AuthorizerFunctionArn")
        });

        new CfnOutput(this, 'AvpNamespace', {
            value: avp.AvpNamespace,
            exportName: 'AvpNamespace',
          });

        new CfnOutput(this, 'PolicyStoreId', {
        value: avp.policyStoreId,
        exportName: 'PolicyStoreId',
        });
    }
}