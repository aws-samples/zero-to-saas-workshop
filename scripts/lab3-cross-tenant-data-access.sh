#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

TENANT_MGMT_STACK_NAME=TenantUserManagementStack
SERVERLESS_SAAS_STACK_NAME=ServerlessSaaSAppStack
SERVERLESS_SAAS_API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $SERVERLESS_SAAS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text)

echo "api gateway url: $SERVERLESS_SAAS_API_GATEWAY_URL"

TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TenantUserpoolId'].OutputValue" --output text)

TENANT_USERPOOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

TENANT_BASIC_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r '.Users[] |select(.Attributes[].Value == "basic")|.Username')
TENANT_PREMIUM_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r '.Users[] | select(.Attributes[].Value == "premium") | .Username')

NC='\033[0m'
red='\033[0;31m'
green='\033[0;32m'

SHARD_ORDER=""

for TENANT_BASIC_ADMIN in $TENANT_BASIC_ARRAY; do

  echo ""
  echo "-------------------------------------------------"
  echo "Loging in as basic tier tenant User: $TENANT_BASIC_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  TENANT_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id $TENANT_USERPOOL_ID \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --client-id $TENANT_USERPOOL_CLIENT_ID \
    --auth-parameters USERNAME=$TENANT_BASIC_ADMIN,PASSWORD='#ZeroToSaaS1234' \
    --query 'AuthenticationResult.IdToken' \
    --output text)

  echo $TENANT_TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'

  
  echo -e "${NC}"

  echo ""
  echo "-------------------------------------------------"
  echo "Getting all orders of basic tier tenant User: $TENANT_BASIC_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  response=$(curl -s -w "\n%{http_code}" --request GET \
    --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders" \
    --header "Authorization: Bearer ${TENANT_TOKEN}" \
    --header 'content-type: application/json')

  http_code=$(tail -n1 <<< "$response")  # get the last line
  orders_response=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  echo -e "${green}Status $http_code"
  echo -e "${NC}"
  echo $orders_response | jq -R 'fromjson'
 
  while read -r order; do
    shard_id=$(echo "$order" | jq -r '.shardId')
    order_id=$(echo "$order" | jq -r '.orderId')
    SHARD_ORDER+="${shard_id}:${order_id}"
    break
  done <<< $(echo "$orders_response" | jq -c '.[]')
  break
 done


 for TENANT_PREMIUM_ADMIN in $TENANT_PREMIUM_ARRAY; do

  echo ""
  echo "-------------------------------------------------"
  echo "Loging in as premium tier tenant User: $TENANT_PREMIUM_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  TENANT_PREMIUM_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id $TENANT_USERPOOL_ID \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --client-id $TENANT_USERPOOL_CLIENT_ID \
    --auth-parameters USERNAME=$TENANT_PREMIUM_ADMIN,PASSWORD='#ZeroToSaaS1234' \
    --query 'AuthenticationResult.IdToken' \
    --output text)

  echo $TENANT_PREMIUM_TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'

  echo -e "${NC}"

  echo ""
  echo "-------------------------------------------------"
  echo "Using Premium tenant ID Token to fetch order $SHARD_ORDER created by Basic Tenant"
  echo "-------------------------------------------------"
  echo ""

    # Get and update each order
    echo "GET order: ${order_id}"
    response=$(curl -s -w "\n%{http_code}" --request GET \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders/${SHARD_ORDER}" \
      --header "Authorization: Bearer ${TENANT_PREMIUM_TOKEN}" \
      --header 'content-type: application/json')

    http_code=$(tail -n1 <<< "$response")  # get the last line
    orders_response=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

    if [ $http_code == "200" ]; then
        echo -e "${red}Status $http_code"
    else
        echo -e "${green}Status $http_code"
    fi
    
    echo -e "${NC}"
    echo $orders_response | jq -R 'fromjson'
    break
 done