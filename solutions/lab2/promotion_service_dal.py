# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

from pprint import pprint
import os
import boto3
from botocore.exceptions import ClientError
import uuid
from models.promotion_models import Promotion
from utils import logger,dynamodb_table
import random
from boto3.dynamodb.conditions import Key

table_name = os.environ['TABLE_NAME']
dynamodb = None

suffix_start = 1 
suffix_end = 10
 
def get_promotion(event, key):
    table = __get_dynamodb_table(event)

    try:
        shardId = key.split(":")[0]
        promotionId = key.split(":")[1] 
        logger.log_with_tenant_context(event, shardId)
        logger.log_with_tenant_context(event, promotionId)
        response = table.get_item(Key={'shardId': shardId, 'promotionId': promotionId}, ReturnConsumedCapacity='TOTAL')
        item = response['Item']
        promotion = Promotion(item['shardId'], item['promotionId'], item['promotionName'], item['productId'],
                              item['discountPercent'])
        consumed_capacity = response['ConsumedCapacity']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise Exception('Error getting a promotion', e)
    else:
        return promotion, consumed_capacity

def delete_promotion(event, key):
    table = __get_dynamodb_table(event)
    
    try:
        shardId = key.split(":")[0]
        promotionId = key.split(":")[1] 
        response = table.delete_item(Key={'shardId':shardId, 'promotionId': promotionId}, ReturnConsumedCapacity='TOTAL')
        consumed_capacity = response['ConsumedCapacity']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise Exception('Error deleting a promotion', e)
    else:
        logger.info("DeleteItem succeeded:")
        return response, consumed_capacity


def create_promotion(event, payload):
    tenantId = event['requestContext']['authorizer']['tenantId']
    table = __get_dynamodb_table(event)
    suffix = random.randrange(suffix_start, suffix_end)

    #-------------------------------------------------------------------------
    #Lab2 - Update  shardId - partition based on tenantId
    #-------------------------------------------------------------------------
    promotionId = str(uuid.uuid4())
    shardId = tenantId+"-"+str(suffix)
   
    promotion = Promotion(shardId, promotionId, 
                          payload.promotionName, payload.productId,payload.discountPercent)

    try:
        response = table.put_item(Item={
        'shardId':shardId,
        'promotionId': promotion.promotionId, 
        'promotionName': promotion.promotionName,
        'productId': promotion.promotionName,
        'discountPercent': promotion.discountPercent
        }, ReturnConsumedCapacity='TOTAL')
        consumed_capacity = response['ConsumedCapacity']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise Exception('Error adding a promotion', e)
    else:
        logger.info("PutItem succeeded:")
        return promotion, consumed_capacity

def update_promotion(event, payload, key):
    table = __get_dynamodb_table(event)
    
    try:
        shardId = key.split(":")[0]
        promotionId = key.split(":")[1] 
        logger.log_with_tenant_context(event, shardId)
        logger.log_with_tenant_context(event, promotionId)
        promotion = Promotion(shardId, promotionId,payload.promotionName, payload.productId,payload.discountPercent)
        response = table.update_item(Key={'shardId':promotion.shardId, 'promotionId': promotion.promotionId},
        UpdateExpression="set promotionName=:promotionName, "
        +"discountPercent=:discountPercent",
        ExpressionAttributeValues={
            ':promotionName': promotion.promotionName,
            ':discountPercent': promotion.discountPercent
        },
        ReturnValues="UPDATED_NEW", ReturnConsumedCapacity='TOTAL')
        consumed_capacity = response['ConsumedCapacity']
    except ClientError as e:
        logger.error(e.response['Error']['Message'])
        raise Exception('Error updating a promotion', e)
    else:
        logger.info("UpdateItem succeeded:")
        return promotion, consumed_capacity

def get_promotions(event, tenantId):
    raise Exception('No Implemented')
           

def __get_dynamodb_table(event):
    return dynamodb_table.get_dynamodb_table(event,table_name)