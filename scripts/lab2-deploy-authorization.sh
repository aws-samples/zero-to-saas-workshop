#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

echo "=================================="
echo "Updating Tenant Authorization"
echo "=================================="

cd ~/aws-zero-to-saas-workshop/saas-application/tenant-usr-mgmt/cdk

cdk deploy 'TenantAuthorizationStack' --require-approval never --concurrency 10 --asset-parallelism true


echo "================================"
echo "Updating Tenant User Management"
echo "================================"

cd ~/aws-zero-to-saas-workshop/saas-application/tenant-usr-mgmt

python3 -m pip install pylint

cd src
python3 -m pylint -E -d E0401 $(find . -iname "*.py" -not -path "./.aws-sam/*")

cd ../cdk
npm install
npm run build

cdk bootstrap

echo "Get AVP Store Id and AVP namespace"

export CDK_PARAM_AVP_STORE_ID=$(aws cloudformation describe-stacks --stack-name TenantAuthorizationStack --query "Stacks[0].Outputs[?OutputKey=='PolicyStoreId'].OutputValue" --output text 2> out.txt)
echo $CDK_PARAM_AVP_STORE_ID
export CDK_PARAM_AVP_NAMESPACE=$(aws cloudformation describe-stacks --stack-name TenantAuthorizationStack --query "Stacks[0].Outputs[?OutputKey=='AvpNamespace'].OutputValue" --output text 2> out.txt)
echo $CDK_PARAM_AVP_NAMESPACE

cdk deploy 'TenantUserManagementStack' --require-approval never --concurrency 10 --asset-parallelism true