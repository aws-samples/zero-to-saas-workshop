#!/bin/bash -e

export CDK_PARAM_SYSTEM_ADMIN_EMAIL="saasadmin@simulator.amazonses.com"

# Preprovision base infrastructure
cd ../cdk
npm install

npx cdk bootstrap
npx cdk deploy --all --require-approval never --concurrency 10 --asset-parallelism true
