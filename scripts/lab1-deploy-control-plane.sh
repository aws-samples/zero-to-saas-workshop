#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

export CDK_PARAM_SYSTEM_ADMIN_EMAIL="saasadmin@simulator.amazonses.com"

# Preprovision base infrastructure
cd ~/aws-zero-to-saas-workshop/saas-shared-services/saas-control-plane/cdk

npm install typescript
npm install aws-cdk
cdk bootstrap

cdk deploy 'SaaSControlPlaneStack' --require-approval never --concurrency 10 --asset-parallelism true