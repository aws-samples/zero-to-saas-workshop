// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

# Enable nocasematch option
shopt -s nocasematch

# Parse tenant details from the input message from step function
export CDK_PARAM_TENANT_ID=$(echo $tenantId | tr -d '"')
export TENANT_ADMIN_EMAIL=$(echo $email | tr -d '"')
export TENANT_TIER=$(echo $tier | tr -d '"')

# TENANT USER MANAGEMENT SERVICE : Provision a new tenant admin user
# Define variables
USER_MANANGEMENT_STACK_NAME="TenantUserManagementStack"
TENANT_ADMIN_USERNAME="tenant-admin-$CDK_PARAM_TENANT_ID"
USER_POOL_OUTPUT_PARAM_NAME="TenantUserpoolId"
API_GATEWAY_URL_OUTPUT_PARAM_NAME="ApiGatewayUrl"
APP_CLIENT_ID_OUTPUT_PARAM_NAME="UserPoolClientId"

# Read tenant details from the cloudformation stack output parameters
SAAS_APP_USERPOOL_ID=$(aws cloudformation describe-stacks --stack-name $USER_MANANGEMENT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$USER_POOL_OUTPUT_PARAM_NAME'].OutputValue" --output text)
SAAS_APP_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $USER_MANANGEMENT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$APP_CLIENT_ID_OUTPUT_PARAM_NAME'].OutputValue" --output text)
API_GATEWAY_URL=$(aws cloudformation describe-stacks --stack-name $USER_MANANGEMENT_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='$API_GATEWAY_URL_OUTPUT_PARAM_NAME'].OutputValue" --output text)

# Create tenant admin user
aws cognito-idp admin-create-user \
  --user-pool-id "$SAAS_APP_USERPOOL_ID" \
  --username "$TENANT_ADMIN_USERNAME" \
  --user-attributes Name=email,Value="$TENANT_ADMIN_EMAIL" Name=email_verified,Value="True" Name=phone_number,Value="+11234567890" Name="custom:userRole",Value="TenantAdmin" Name="custom:tenantId",Value="$CDK_PARAM_TENANT_ID" Name="custom:tenantTier",Value="$TENANT_TIER" \
  --desired-delivery-mediums EMAIL

echo "Set user password"
aws cognito-idp admin-set-user-password \
  --user-pool-id $SAAS_APP_USERPOOL_ID \
  --username $TENANT_ADMIN_USERNAME \
  --password '#ZeroToSaaS1234' \
  --permanent

# Create JSON response of output parameters
export tenantConfig=$(jq --arg SAAS_APP_USERPOOL_ID "$SAAS_APP_USERPOOL_ID" \
  --arg SAAS_APP_CLIENT_ID "$SAAS_APP_CLIENT_ID" \
  --arg API_GATEWAY_URL "$API_GATEWAY_URL" \
  -n '{"userPoolId":$SAAS_APP_USERPOOL_ID,"appClientId":$SAAS_APP_CLIENT_ID,"apiGatewayUrl":$API_GATEWAY_URL}')
export tenantStatus="Complete"