#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

TENANT_MGMT_STACK_NAME=TenantUserManagementStack
SERVERLESS_SAAS_STACK_NAME=ServerlessSaaSAppStack

SERVERLESS_SAAS_API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $SERVERLESS_SAAS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text)
echo "api gateway url: $SERVERLESS_SAAS_API_GATEWAY_URL"

TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TenantUserpoolId'].OutputValue" --output text)

TENANT_USERPOOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

TENANT_ADMIN_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r '.Users[] | select(.Attributes[].Value == "basic") | .Username')

NC='\033[0m'
red='\033[0;31m'
green='\033[0;32m'
blue='\033[0;34m'

# loop through the users
for TENANT_ADMIN in $TENANT_ADMIN_ARRAY; do

  TENANT_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id $TENANT_USERPOOL_ID \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --client-id $TENANT_USERPOOL_CLIENT_ID \
    --auth-parameters USERNAME=$TENANT_ADMIN,PASSWORD='#ZeroToSaaS1234' \
    --query 'AuthenticationResult.IdToken' \
    --output text)

  echo -e "${NC}"

  echo "-------------------------------------------------"
  echo "Getting all orders for User: $TENANT_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  # Get all orders
  orders_response=$(curl -s --request GET \
    --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders" \
    --header "Authorization: Bearer ${TENANT_TOKEN}" \
    --header 'content-type: application/json')
  # Parse the JSON response and loop through each order
  echo "$orders_response" | jq -c '.[]' | while read -r order; do
    shard_id=$(echo "$order" | jq -r '.shardId')
    order_id=$(echo "$order" | jq -r '.orderId')
    echo -e "Order: ${shard_id}:${order_id}"
    echo -e "TenantId: ${blue}${shard_id}"
    echo -e "${NC}OrderId: ${blue}${order_id}"
    echo -e "${NC}"
  done
  echo -e "${NC}"
done