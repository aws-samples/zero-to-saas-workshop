#!/bin/bash -e

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

echo "================================"
echo "Updating SaaS application"
echo "================================"

cd ~/aws-zero-to-saas-workshop/saas-application/serverless-services

python3 -m pip install pylint

cd src
python3 -m pylint -E -d E0401 $(find . -iname "*.py" -not -path "./.aws-sam/*" -not -path "./extensions/*")

if ! [ -f /extensions/telemetry-api/extension.zip ]; then
    # Build extension.
    cd extensions/telemetry-api
    chmod +x python_example_telemetry_api_extension/extension.py
    pip3 install -r python_example_telemetry_api_extension/requirements.txt -t ./python_example_telemetry_api_extension/

    chmod +x extensions/python_example_telemetry_api_extension
    zip -r extension.zip extensions python_example_telemetry_api_extension
    
    cd ~/aws-zero-to-saas-workshop/saas-application/serverless-services
fi

cd cdk
npm install
npm run build

cdk deploy 'ServerlessSaaSAppStack' --require-approval never --concurrency 10 --asset-parallelism true