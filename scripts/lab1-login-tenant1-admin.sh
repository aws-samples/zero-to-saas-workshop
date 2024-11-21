#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

TENANT_MGMT_STACK_NAME=TenantUserManagementStack
SERVERLESS_SAAS_STACK_NAME=ServerlessSaaSAppStack

SERVERLESS_SAAS_API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $SERVERLESS_SAAS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text)

echo "API Gateway URL: $SERVERLESS_SAAS_API_GATEWAY_URL"

TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TenantUserpoolId'].OutputValue" --output text)

TENANT_USERPOOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

TENANT_ADMIN_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r '.Users[] | select(.Attributes[].Value == "basic") | .Username')

# loop through the users
for TENANT_ADMIN in $TENANT_ADMIN_ARRAY; do
  echo "Login with user $TENANT_ADMIN"
  echo "-----------------------------"
  
  TENANT_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id $TENANT_USERPOOL_ID \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --client-id $TENANT_USERPOOL_CLIENT_ID \
    --auth-parameters USERNAME=$TENANT_ADMIN,PASSWORD='#ZeroToSaaS1234' \
    --query 'AuthenticationResult.IdToken' \
    --output text)

  echo $TENANT_TOKEN | jq -R 'split(".") | .[0],.[1] | @base64d | fromjson'
  exit
done
