# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

import abc
class IdpAuthorizerAbstractClass (abc.ABC):
    
    @abc.abstractmethod
    def validateJWT(self,event):
        pass