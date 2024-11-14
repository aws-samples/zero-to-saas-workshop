# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
import os
import boto3

from utils import logger
from utils import idp_object_factory

region = os.environ['AWS_REGION']

sts_client = boto3.client("sts", region_name=region)
cognito_identity_client = boto3.client('cognito-identity')
verifiedpermissions_client = boto3.client('verifiedpermissions',region_name=region)


idp_details=json.loads(os.environ['IDP_DETAILS'])
idp_authorizer_service = idp_object_factory.get_idp_authorizer_object(idp_details['name'])

#AVP
policy_store_id = os.environ.get('POLICY_STORE_ID')
avp_namespace = os.environ.get('AVP_NAMESPACE')
resource_type = f"{avp_namespace}::Application"
resource_id = avp_namespace
action_type = f"{avp_namespace}::Action"


def lambda_handler(event, context):
    
    input_details={}
    input_details['idpDetails'] = idp_details
    
    token = event['headers'].get('Authorization', event['headers'].get('authorization', ''))
    
    if token.lower().startswith('bearer '):
        token = token.split(' ')[1]
  
    jwt_bearer_token = token

    logger.info("Method ARN: " + event['methodArn'])

    input_details['jwtToken']=jwt_bearer_token

    response = idp_authorizer_service.validateJWT(input_details)

    identitypool_id = input_details['idpDetails']['details']['identityPoolId']

    # get authenticated claims
    if (response is False):
        logger.error('Unauthorized')
        raise Exception('Unauthorized')
    else:
        logger.info(response)
        principal_id = response["sub"]
        user_name = response["cognito:username"]
        tenant_id = response["custom:tenantId"]
        user_role = response["custom:userRole"]        
    
    tmp = event['methodArn'].split(':')
    aws_account_id = tmp[4]

    #Authroization not based on tenant

    authResponse = {
            'principalId': principal_id,
            'policyDocument': {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Action': 'execute-api:Invoke',
                        'Effect': 'Allow',
                        'Resource': event['methodArn']
                    }
                ]
            },
            'context': {
                'actionId': get_action_id(event),
                'userName': user_name,
                'tenantId': tenant_id,
                'userRole': user_role
            }
    }

    #----------------------------------------
    #Lab2 AVP based authorization for tenants
    #-----------------------------------------


    #----------------------------------------
    #Lab3 - ABAC based tenant scope access policies
    #----------------------------------------
    
       
    return authResponse


def authorize_avp(event,id_token):

    logger.info("Authorizing with AVP")

    try:
        action_id = get_action_id(event);
        logger.info(action_id)
        
        input_data = {
            'identityToken': id_token,
            'policyStoreId': policy_store_id,
            'action': {
                'actionType': action_type,
                'actionId': action_id,
            },
            'resource': {
                'entityType': resource_type,
                'entityId': resource_id
            }
        }

        logger.info(input_data)
        
        auth_response = verifiedpermissions_client.is_authorized_with_token(**input_data)
        
        logger.info("Decision from AVP: " + auth_response['decision'])
       
        return auth_response

    except Exception as e:
        logger.info(e)
        return 'DENY'
        
def get_abac_credentials(authenticationResponse,id_token,aws_account_id,identitypool_id):
    
    provider_name = authenticationResponse["iss"][8:] # get rid of https://
    logins = {}
    logins[provider_name] = id_token

    identity_response = cognito_identity_client.get_id(
        AccountId=aws_account_id,
        IdentityPoolId=identitypool_id,
        Logins=logins
    )
    assumed_role = cognito_identity_client.get_credentials_for_identity(
        IdentityId=identity_response['IdentityId'],
        Logins=logins
    )
    return assumed_role["Credentials"]

def get_action_id(event):
    #GET httpMethod & resourcePath 
    action_id = f"{event['requestContext']['httpMethod']} {event['requestContext']['resourcePath']}".lower()
    return action_id