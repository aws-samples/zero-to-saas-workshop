#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

PASSWORD="#ZeroToSaaS1234"

CONTROL_PLANE_STACK_NAME="SaaSControlPlaneStack"

CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $CONTROL_PLANE_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneIdpDetails'].OutputValue" | jq -r '.[0]' | jq -r '.idp.clientId')
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $CONTROL_PLANE_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneIdpDetails'].OutputValue" | jq -r '.[0]' | jq -r '.idp.userPoolId')
USER="admin"

# required in order to initiate-auth
RESULT=$(aws cognito-idp update-user-pool-client \
          --user-pool-id "$USER_POOL_ID" \
          --client-id "$CLIENT_ID" \
          --explicit-auth-flows USER_PASSWORD_AUTH)

# remove need for password reset
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USER" \
    --password "$PASSWORD" \
    --permanent

# get credentials for user
AUTHENTICATION_RESULT=$(aws cognito-idp initiate-auth \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "${CLIENT_ID}" \
    --auth-parameters "USERNAME=${USER},PASSWORD='${PASSWORD}'" \
    --query 'AuthenticationResult')

ID_TOKEN=$(echo "$AUTHENTICATION_RESULT" | jq -r '.IdToken')

CONTROL_PLANE_API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$CONTROL_PLANE_STACK_NAME" \
    --query "Stacks[0].Outputs[?contains(OutputKey,'controlPlaneAPIEndpoint')].OutputValue" \
    --output text)

tier_var[1]='basic'
tier_var[2]='premium'

echo "-------------------------------------------------"
echo "Tenant onboarding API endpoint: ${CONTROL_PLANE_API_ENDPOINT}tenants"
echo "-------------------------------------------------"
echo ""

for i in {1..2}; do

    TENANT_NAME="tenant_${tier_var[${i}]}${i}"
    TENANT_EMAIL="success+tenant_${tier_var[${i}]}${i}@simulator.amazonses.com"
    TENANT_TIER="${tier_var[${i}]}"

    echo "Creating $TENANT_TIER tier tenant"
    echo "----------------------------------"

    DATA=$(jq --null-input \
        --arg tenantName "$TENANT_NAME" \
        --arg tenantEmail "$TENANT_EMAIL" \
        --arg tenantTier "$TENANT_TIER" \
        '{
          "tenantName": $tenantName,
          "email": $tenantEmail,
          "tier": $tenantTier,
          "tenantStatus": "In progress"
        }')

    curl --request POST \
        --url "${CONTROL_PLANE_API_ENDPOINT}tenants" \
        --header "Authorization: Bearer ${ID_TOKEN}" \
        --header 'content-type: application/json' \
        --data "$DATA" | jq -R 'fromjson'
done