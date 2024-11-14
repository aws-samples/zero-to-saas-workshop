#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

install_dependencies(){
    #docker
PATH=$PATH:/home/workshop_user/.local/bin
export PATH
}


increase_disksize(){

# Specify the desired volume size in GiB as a command line argument. If not specified, default to 50 GiB.
SIZE=50

TOKEN=$(curl --request PUT "http://169.254.169.254/latest/api/token" --header "X-aws-ec2-metadata-token-ttl-seconds: 3600")

# Get the ID of the environment host Amazon EC2 instance.
INSTANCEID=$(curl http://169.254.169.254/latest/meta-data/instance-id --header "X-aws-ec2-metadata-token: $TOKEN")
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone --header "X-aws-ec2-metadata-token: $TOKEN" | sed 's/\(.*\)[a-z]/\1/')

# Get the ID of the Amazon EBS volume associated with the instance.
VOLUMEID=$(aws ec2 describe-instances \
  --instance-id $INSTANCEID \
  --query "Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId" \
  --output text \
  --region $REGION)

# Resize the EBS volume.
aws ec2 modify-volume --volume-id $VOLUMEID --size $SIZE

# Wait for the resize to finish.
while [ \
  "$(aws ec2 describe-volumes-modifications \
    --volume-id $VOLUMEID \
    --filters Name=modification-state,Values="optimizing","completed" \
    --query "length(VolumesModifications)"\
    --output text)" != "1" ]; do
    sleep 1
done

#Check if we're on an NVMe filesystem
if [[ -e "/dev/xvda" && $(readlink -f /dev/xvda) = "/dev/xvda" ]]
then
  # Rewrite the partition table so that the partition takes up all the space that it can.
  sudo growpart /dev/xvda 1

  # Expand the size of the file system.
  # Check if we're on AL2
  STR=$(cat /etc/os-release)
  SUB="VERSION_ID=\"2023\""
  if [[ "$STR" == *"$SUB"* ]]
  then
    sudo xfs_growfs -d /
  else
    sudo resize2fs /dev/xvda1
  fi

else
  # Rewrite the partition table so that the partition takes up all the space that it can.
  sudo growpart /dev/nvme0n1 1

  # Expand the size of the file system.
  # Check if we're on AL2
  STR=$(cat /etc/os-release)
  SUB="VERSION_ID=\"2023\""
  if [[ "$STR" == *"$SUB"* ]]
  then
    sudo xfs_growfs -d /
  else
    sudo resize2fs /dev/nvme0n1p1
  fi
fi

}

install_microservices(){

    cd ~/$REPO_NAME/saas-application/serverless-services/src

    python3 -m pip install pylint 
    python3 -m pylint -E -d E0401 $(find . -iname "*.py" -not -path "./.aws-sam/*" -not -path "./extensions/*")

    # Build extension.
    cd extensions/telemetry-api
    chmod +x python_example_telemetry_api_extension/extension.py
    pip3 install -r python_example_telemetry_api_extension/requirements.txt -t ./python_example_telemetry_api_extension/

    chmod +x extensions/python_example_telemetry_api_extension
    zip -r extension.zip extensions python_example_telemetry_api_extension

    cd ~/$REPO_NAME/saas-application/serverless-services/cdk
    
    npm install typescript
    npm install aws-cdk
    cdk bootstrap
        
    npm install
    npm run build
    cdk deploy --all --require-approval never --concurrency 10 --asset-parallelism true
}

install_avp()
{
    cd ~/$REPO_NAME/saas-application/tenant-usr-mgmt/cdk

    npm install typescript
    npm install aws-cdk
    cdk bootstrap
        
    npm install
    npm run build

    cdk deploy 'TenantAuthorizationStack' --require-approval never --concurrency 10 --asset-parallelism true
}


install_tenantusermanagement_services(){

    cd ~/$REPO_NAME/saas-application/tenant-usr-mgmt/src

    python3 -m pip install pylint
    python3 -m pylint -E -d E0401 $(find . -iname "*.py" -not -path "./.aws-sam/*")

    cd ../cdk

    npm install typescript
    npm install aws-cdk
    cdk bootstrap

    npm install
    npm run build

    export CDK_PARAM_AVP_STORE_ID=$(aws cloudformation describe-stacks --stack-name TenantAuthorizationStack --query "Stacks[0].Outputs[?OutputKey=='PolicyStoreId'].OutputValue" --output text 2> out.txt)
    echo $CDK_PARAM_AVP_STORE_ID
    export CDK_PARAM_AVP_NAMESPACE=$(aws cloudformation describe-stacks --stack-name TenantAuthorizationStack --query "Stacks[0].Outputs[?OutputKey=='AvpNamespace'].OutputValue" --output text 2> out.txt)
    echo $CDK_PARAM_AVP_NAMESPACE
    
    cdk deploy 'TenantUserManagementStack' --require-approval never --concurrency 10 --asset-parallelism true
}