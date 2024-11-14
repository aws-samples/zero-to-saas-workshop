#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

TENANT_MGMT_STACK_NAME=TenantUserManagementStack
SERVERLESS_SAAS_STACK_NAME=ServerlessSaaSAppStack

SERVERLESS_SAAS_API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $SERVERLESS_SAAS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text)
echo "api gateway url: $SERVERLESS_SAAS_API_GATEWAY_URL"

TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TenantUserpoolId'].OutputValue" --output text)

TENANT_USERPOOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

TENANT_ADMIN_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r '.Users[] | select(.Attributes[].Value == "premium") | .Username')

NC='\033[0m'
red='\033[0;31m'
green='\033[0;32m'

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

  echo ""
  echo "-------------------------------------------------"
  echo "Creating Product data for Premium tier User: $TENANT_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  response=$(curl -s -w "\n%{http_code}" --request POST \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}products" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json' \
      --data "{\"name\":\"Product-1\",\"price\":100,\"sku\":\"1\",\"category\":\"category-1\"}")

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code != "200" ]; then
      echo -e "${red}Error creating Product"
      echo -e "${red}Status $http_code"
  else
      echo -e "${green}Product created successfully"
      product_id=$(echo "$content" | jq -r '.productId')
      echo "Product ID: $product_id"
  fi

  
  echo -e "${NC}"

  echo ""
  echo "-------------------------------------------------"
  echo "Creating Order data for Premium tier User: $TENANT_ADMIN"
  echo "-------------------------------------------------"
  echo ""

  response=$(curl -s -w "\n%{http_code}" --request POST \
    --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders" \
    --header "Authorization: Bearer ${TENANT_TOKEN}" \
    --header 'content-type: application/json' \
    --data "{\"orderName\":\"test order\",\"orderProducts\": [{ \"productId\":\"1\", \"quantity\":2 }]}")

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code != "200" ]; then
      echo -e "${red}Error creating Order"
      echo -e "${red}Status $http_code"
  else
      echo -e "${green}Order created successfully"
      order_id=$(echo "$content" | jq -r '.orderId')
      echo "Order ID: $order_id"
  fi

  echo -e "${NC}"

  echo ""
  echo "-------------------------------------------------"
  echo "Creating Promotion data for Premium tier User: $TENANT_ADMIN"
  echo "-------------------------------------------------"
  echo ""
  response=$(curl -s -w "\n%{http_code}" --request POST \
  --url "${SERVERLESS_SAAS_API_GATEWAY_URL}promotions" \
  --header "Authorization: Bearer ${TENANT_TOKEN}" \
  --header 'content-type: application/json' \
  --data "{\"promotionName\":\"test promo\",\"productId\":\"$i\",\"discountPercent\":\"5\"}")

  http_code=$(tail -n1 <<< "$response")  # get the last line
  content=$(sed '$ d' <<< "$response")   # get all but the last line which contains the status code

  if [ $http_code != "200" ]; then
      echo -e "${red}Error creating promotion"
      echo -e "${red}Status $http_code"
  else
      echo -e "${green}Promotion created successfully"
      promotion_id=$(echo "$content" | jq -r '.promotionId')
      echo "Promotion ID: $promotion_id"
  fi
  
echo -e "${NC}"

done