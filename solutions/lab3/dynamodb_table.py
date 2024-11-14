# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import boto3


def get_dynamodb_table(event,table_name):
    """DynamoDB table"""

    #-------------------------------------------------------------------------
    #Lab3 - Pass credentials from STS token
    #-------------------------------------------------------------------------

    accesskey = event['requestContext']['authorizer']['accesskey']
    secretkey = event['requestContext']['authorizer']['secretkey']
    sessiontoken = event['requestContext']['authorizer']['sessiontoken']    

    dynamodb = boto3.resource('dynamodb',
            aws_access_key_id=accesskey,
            aws_secret_access_key=secretkey,
            aws_session_token=sessiontoken
            )
    
    return dynamodb.Table(table_name)  