#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

REPO_URL=$1

FUNCTIONS=( _workshop-conf.sh _workshop-shared-functions.sh _create-workshop.sh )
for FUNCTION in "${FUNCTIONS[@]}"; do
    if [ -f $FUNCTION ]; then
        source $FUNCTION
    else
        echo "ERROR: $FUNCTION not found"
    fi
done

## Variables
REGION=$(aws ec2 describe-availability-zones --output text --query 'AvailabilityZones[0].[RegionName]')

## Init
rm -vf ~/.aws/credentials

echo  "increasing disk size"
#increase_disksize
echo  "increasing disk size done"

cd ~/$REPO_NAME/deployment && ./configure-logs.sh

echo "Creating workshop"
#install_dependencies
install_tenantusermanagement_services
install_avp
#update tenantusermanagement_services with AVP details (tenant authorizer)
install_tenantusermanagement_services
install_microservices
echo "Success - Workshop created!"
