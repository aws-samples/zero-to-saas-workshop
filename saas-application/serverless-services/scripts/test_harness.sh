#!/bin/bash -e

TENANT_MGMT_STACK_NAME=TenantUserManagementStack
SERVERLESS_SAAS_STACK_NAME=ServerlessSaaSAppStack
echo "Testing Product and Order service"

echo "Get ApiGatewayUrl from the cloudformation stack"
SERVERLESS_SAAS_API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $SERVERLESS_SAAS_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text)
echo "api gateway url: $SERVERLESS_SAAS_API_GATEWAY_URL"

echo "Get user pool id from the cloudformation stack"
TENANT_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TenantUserpoolId'].OutputValue" --output text)
echo "User pool id: $TENANT_USERPOOL_ID"

echo "Get user pool client id from the cloudformation stack"
TENANT_USERPOOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $TENANT_MGMT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
echo "User pool client id: $TENANT_USERPOOL_CLIENT_ID"

echo "List user pool users"
TENANT_ADMIN_ARRAY=$(aws cognito-idp list-users --user-pool-id $TENANT_USERPOOL_ID  | jq -r ".Users[].Username")
echo $TENANT_ADMIN_ARRAY

# loop through the users
for TENANT_ADMIN in $TENANT_ADMIN_ARRAY; do
  echo "Creating data for Test User: $TENANT_ADMIN"
  echo "Login with user"
  TENANT_TOKEN=$(aws cognito-idp admin-initiate-auth \
    --user-pool-id $TENANT_USERPOOL_ID \
    --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --client-id $TENANT_USERPOOL_CLIENT_ID \
    --auth-parameters USERNAME=$TENANT_ADMIN,PASSWORD='#ZeroToSaaS1234' \
    --query 'AuthenticationResult.IdToken' \
    --output text)

  ITERATOR=1

  # Create promotions
  for i in $(seq 1 $ITERATOR); do
    echo "Creating promotion $i"
    promotion_response=$(curl -s --request POST \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}promotions" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json' \
      --data "{\"promotionName\":\"test promo\",\"productId\":\"$i\",\"discountPercent\":\"5\"}")

    promotion_id=$(echo "$promotion_response" | jq -r '.promotionId')
    echo "promotion created: $promotion_id"
  done
  
  # Create products
  for i in $(seq 1 $ITERATOR); do
    echo "Adding product $i"
    curl --request POST \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}products" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json' \
      --data "{\"name\":\"Product-$i\",\"price\":$i,\"sku\":\"1\",\"category\":\"category-$i\"}"
      echo
  done

  # Get all products
  response=$(curl -s --request GET \
    --url "${SERVERLESS_SAAS_API_GATEWAY_URL}products" \
    --header "Authorization: Bearer ${TENANT_TOKEN}" \
    --header 'content-type: application/json')

  echo "Success GET all products: ${response}"

  # Parse the JSON response and loop through each product
  echo "$response" | jq -c '.[]' | while read -r product; do
    shard_id=$(echo "$product" | jq -r '.shardId')
    product_id=$(echo "$product" | jq -r '.productId')
    shard_product="${shard_id}:${product_id}"

    # Get and update each product
    echo "GET product: ${shard_product}"
    
    product_response=$(curl -s --request GET \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}products/${shard_product}" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json')
    # Extract properties from the product response
    product_name=$(echo "$product_response" | jq -r '.name')
    updated_name="${product_name}-updated"

    echo "PUT product: ${shard_product}"
    curl --request PUT \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}products/${shard_product}" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json' \
      --data "{\"name\":\"${updated_name}\",\"price\":100,\"sku\":\"2\",\"category\":\"category-update\"}"
  done

  # Create orders
  for i in $(seq 1 $ITERATOR); do
    echo "Creating order $i"
    order_response=$(curl -s --request POST \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json' \
      --data "{\"orderName\":\"test order\",\"orderProducts\": [{ \"productId\":\"$i\", \"quantity\":2 }]}")

    order_id=$(echo "$order_response" | jq -r '.orderId')
    echo "Order created: $order_id"
  done

  # Get all orders
  echo "Getting all orders"
  orders_response=$(curl -s --request GET \
    --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders" \
    --header "Authorization: Bearer ${TENANT_TOKEN}" \
    --header 'content-type: application/json')

  echo "Success GET all orders: ${orders_response}"

  # Parse the JSON response and loop through each order
  echo "$orders_response" | jq -c '.[]' | while read -r order; do
    shard_id=$(echo "$order" | jq -r '.shardId')
    order_id=$(echo "$order" | jq -r '.orderId')
    shard_order="${shard_id}:${order_id}"

    # Get and update each order
    echo "GET order: ${order_id}"
    curl --request GET \
      --url "${SERVERLESS_SAAS_API_GATEWAY_URL}orders/${shard_order}" \
      --header "Authorization: Bearer ${TENANT_TOKEN}" \
      --header 'content-type: application/json'
    echo    
  done
done