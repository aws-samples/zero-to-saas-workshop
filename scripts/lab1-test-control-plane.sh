#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

CONTROL_PLANE_STACK_NAME="SaaSControlPlaneStack"
USER="admin"
PASSWORD="#ZeroToSaaS1234"

# Retrieve deployment outputs for the identity provider (Amazon Cognito)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $CONTROL_PLANE_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneIdpDetails'].OutputValue" | jq -r '.[0]' | jq -r '.idp.clientId')
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $CONTROL_PLANE_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneIdpDetails'].OutputValue" | jq -r '.[0]' | jq -r '.idp.userPoolId')

# Set the temporary password to be a permanent password for testing purposes
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USER" \
    --password "$PASSWORD" \
    --permanent

# Set a username and password auth flow for the user pool client and retrieve output
aws cognito-idp update-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-id "$CLIENT_ID" \
    --explicit-auth-flows USER_PASSWORD_AUTH \
    --query 'UserPoolClient.UserPoolId'

# Retrieve an id token by authenticating to the identity provider
ID_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters "USERNAME=${USER},PASSWORD='${PASSWORD}'" \
  --query 'AuthenticationResult.IdToken' \
  --output 'text'
)
# Retrieve deployment outputs for the control plane API (Amazon API Gateway)
CONTROL_PLANE_API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$CONTROL_PLANE_STACK_NAME" \
    --query "Stacks[0].Outputs[?contains(OutputKey,'controlPlaneAPIEndpoint')].OutputValue" \
    --output text)

echo "-------------------------------------------------"
echo "Tenant Management API endpoint: ${CONTROL_PLANE_API_ENDPOINT}tenants"
echo "-------------------------------------------------"
echo ""


curl --request GET \
    --url "${CONTROL_PLANE_API_ENDPOINT}tenants" \
    --header "Authorization: Bearer ${ID_TOKEN}" | jq -R 'fromjson'