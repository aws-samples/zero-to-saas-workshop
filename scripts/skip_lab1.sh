# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0
#!/bin/bash -e

#git rest to base line

git reset --hard
git clean -f -d

#copy the lab1 Solution file
cp ~/aws-zero-to-saas-workshop/solutions/lab1/saas-control-plane-stack.ts ~/aws-zero-to-saas-workshop/saas-shared-services/saas-control-plane/cdk/lib/saas-control-plane-stack.ts

#Deploy the contol plane 

cd ~/aws-zero-to-saas-workshop/scripts/
./lab1-deploy-control-plane.sh

#Copy Provision tenant solution file

cp ~/aws-zero-to-saas-workshop/solutions/lab1/provision-tenant.sh ~/aws-zero-to-saas-workshop/scripts/provision-tenant.sh

#wait to complete the control plane stack deployment
# sleep 300

cd ~/aws-zero-to-saas-workshop/scripts/
./lab1-deploy-tenant-provisioning.sh

#wait to complete the tenant provisoning  stack to complete
# sleep 200

cd ~/aws-zero-to-saas-workshop/scripts/
./lab1-onboard-tenants.sh

#Check the control plane deployment
cd ~/aws-zero-to-saas-workshop/scripts/
./lab1-test-control-plane.sh
