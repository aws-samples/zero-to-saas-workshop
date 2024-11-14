#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

SAAS_CONTROLPLANE_STACK="SaaSControlPlaneStack"

export CDK_PARAM_CONTROLPLANE_EVENT_MANAGER=$(aws cloudformation describe-stacks --stack-name $SAAS_CONTROLPLANE_STACK --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneEventManager'].OutputValue" --output text)

USER_MANANGEMENT_STACK_NAME="TenantUserManagementStack"
USER_POOL_OUTPUT_PARAM_NAME="TenantUserpoolId"

export CDK_PARAM_TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $USER_MANANGEMENT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$USER_POOL_OUTPUT_PARAM_NAME'].OutputValue" --output text)

cd ~/aws-zero-to-saas-workshop/saas-shared-services/tenant-provisioning/cdk

npm install typescript
npm install aws-cdk
cdk bootstrap

cdk deploy 'SaaSTenantProvisionStack' --require-approval never --concurrency 10 --asset-parallelism true