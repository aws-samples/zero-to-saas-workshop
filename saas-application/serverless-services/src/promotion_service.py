# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import json
from utils import utils
from utils import logger
from utils import metrics_manager
import dal.promotion_service_dal as promotion_service_dal 
from decimal import Decimal
from types import SimpleNamespace
from aws_lambda_powertools import Tracer

tracer = Tracer()


@tracer.capture_lambda_handler
def get_promotion(event, context):
    tenantId = event['requestContext']['authorizer']['tenantId']
    tracer.put_annotation(key="TenantId", value=tenantId)

    logger.log_with_tenant_context(event, "Request received to get a promotion")
    params = event['pathParameters']
    key = params['id']
    logger.log_with_tenant_context(event, params)
    promotion, consumed_capacity = promotion_service_dal.get_promotion(event, key)
    logger.log_with_tenant_and_function_context(event, context, {"consumed_capacity": consumed_capacity},
                                                "This log will be received by the Lambda extension using the Telemetry API")
    metrics_manager.record_metric(event, "SingleOrderRequested", "Count", 1)
    return utils.generate_response(promotion)


@tracer.capture_lambda_handler
def create_promotion(event, context):
    tenantId = event['requestContext']['authorizer']['tenantId']
    tracer.put_annotation(key="TenantId", value=tenantId)

    logger.log_with_tenant_context(event, "Request received to create a promotion")
    payload = json.loads(event['body'], object_hook=lambda d: SimpleNamespace(**d), parse_float=Decimal)
    promotion, consumed_capacity = promotion_service_dal.create_promotion(event, payload)
    logger.log_with_tenant_and_function_context(event, context, {"consumed_capacity": consumed_capacity},
                                                "This log will be received by the Lambda extension using the Telemetry API")
    metrics_manager.record_metric(event, "OrderCreated", "Count", 1)
    return utils.generate_response(promotion)

@tracer.capture_lambda_handler
def update_promotion(event, context):
    tenantId = event['requestContext']['authorizer']['tenantId']
    tracer.put_annotation(key="TenantId", value=tenantId)

    logger.log_with_tenant_context(event, "Request received to update a promotion")
    payload = json.loads(event['body'], object_hook=lambda d: SimpleNamespace(**d), parse_float=Decimal)
    params = event['pathParameters']
    key = params['id']
    promotion, consumed_capacity = promotion_service_dal.update_promotion(event, payload, key)
    logger.log_with_tenant_and_function_context(event, context, {"consumed_capacity": consumed_capacity},
                                                "This log will be received by the Lambda extension using the Telemetry API")
    metrics_manager.record_metric(event, "OrderUpdated", "Count", 1)
    return utils.generate_response(promotion)


@tracer.capture_lambda_handler
def delete_promotion(event, context):
    tenantId = event['requestContext']['authorizer']['tenantId']
    tracer.put_annotation(key="TenantId", value=tenantId)

    logger.log_with_tenant_context(event, "Request received to delete a promotion")
    params = event['pathParameters']
    key = params['id']
    response, consumed_capacity = promotion_service_dal.delete_promotion(event, key)
    logger.log_with_tenant_and_function_context(event, context, {"consumed_capacity": consumed_capacity},
                                                "This log will be received by the Lambda extension using the Telemetry API")
    metrics_manager.record_metric(event, "OrderDeleted", "Count", 1)
    return utils.create_success_response("Successfully deleted the promotion")

@tracer.capture_lambda_handler
def get_promotions(event, context):
    return utils.generate501_response()
