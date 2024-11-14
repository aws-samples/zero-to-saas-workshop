#!/bin/bash -e


SAAS_CONTROLPLANE_STACK="SaaSControlPlaneStack"

export CDK_PARAM_CONTROLPLANE_EVENT_MANAGER=$(aws cloudformation describe-stacks --stack-name $SAAS_CONTROLPLANE_STACK --query "Stacks[0].Outputs[?OutputKey=='ControlPlaneEventManager'].OutputValue" --output text)

# Preprovision base infrastructure
cd ../cdk
npm install

npx cdk bootstrap
npx cdk deploy --all --require-approval never --concurrency 10 --asset-parallelism true
