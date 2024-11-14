# // Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# // SPDX-License-Identifier: MIT-0

#!/bin/bash -e

#Adding tenant context to your DynamoDB partition key

cp ~/aws-zero-to-saas-workshop/solutions/lab2/order_service_dal.py ~/aws-zero-to-saas-workshop/saas-application/serverless-services/src/dal/order_service_dal.py
cp ~/aws-zero-to-saas-workshop/solutions/lab2/product_service_dal.py ~/aws-zero-to-saas-workshop/saas-application/serverless-services/src/dal/product_service_dal.py
cp ~/aws-zero-to-saas-workshop/solutions/lab2/promotion_service_dal.py ~/aws-zero-to-saas-workshop/saas-application/serverless-services/src/dal/promotion_service_dal.py

#Adding tenant context to logs
cp ~/aws-zero-to-saas-workshop/solutions/lab2/logger.py ~/aws-zero-to-saas-workshop/saas-application/serverless-services/src/utils/logger.py

# Adding tenant context to metrics
cp ~/aws-zero-to-saas-workshop/solutions/lab2/metrics_manager.py ~/aws-zero-to-saas-workshop/saas-application/serverless-services/src/utils/metrics_manager.py

# Deploy the App

cd ~/aws-zero-to-saas-workshop/scripts/
./lab2-deploy-application.sh

#Implement tenant based authorization to application features

cp ~/aws-zero-to-saas-workshop/solutions/lab2/policy-store.ts ~/aws-zero-to-saas-workshop/saas-application/tenant-usr-mgmt/cdk/lib/policy-store.ts
cp ~/aws-zero-to-saas-workshop/solutions/lab2/tenant_authorizer.py ~/aws-zero-to-saas-workshop/saas-application/tenant-usr-mgmt/src/tenant_authorizer.py

#wait for the deployment to complete
# sleep 240

#Deploy authorization capability

cd ~/aws-zero-to-saas-workshop/scripts/
./lab2-deploy-authorization.sh

#try adding prodcut as basic tenand admin
cd ~/aws-zero-to-saas-workshop/scripts/
./lab2-test-with-basictenant.sh

#try adding product as premium tenand admin

cd ~/aws-zero-to-saas-workshop/scripts/
./lab2-test-with-premiumtenant.sh



# review the data partitioning strategy
cd ~/aws-zero-to-saas-workshop/scripts/
./lab2-test-database.sh