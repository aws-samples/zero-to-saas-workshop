# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

class Promotion:
    key =''
    def __init__(self, shardId, promotionId, name, productId, discountPercent):
        self.shardId = shardId
        self.promotionId = promotionId
        self.promotionName = name
        self.productId = productId
        self.discountPercent = discountPercent
        self.key = shardId + ':' +  promotionId
                

        

               

        
