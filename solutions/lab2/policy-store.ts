// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs'
import { CfnPolicyStore,CfnIdentitySource,CfnPolicy } from 'aws-cdk-lib/aws-verifiedpermissions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk  from 'aws-cdk-lib'
import * as customResources from 'aws-cdk-lib/custom-resources'
import * as lambda_python from '@aws-cdk/aws-lambda-python-alpha';
import * as path from 'path';
import { Duration } from 'aws-cdk-lib';

export interface PolicyStoreProps
{
    userPoolArn: string
    authFunctionArn : string
}

export class AvpPolicyStore extends Construct{

    public readonly policyStoreId : string;
    public readonly AvpNamespace  : string = "TenantServerlessSaaSAPI";

    constructor(scope: Construct,id: string,props: PolicyStoreProps){
        super(scope,id)

        const policyStore = new CfnPolicyStore(scope, "PolicyStore", {
            description: 'Tenant Policy Store',
            schema: {cedarJson:JSON.stringify(cedarJsonSchema)},
            validationSettings: {mode:'STRICT'},
          });

        new CfnIdentitySource(this, 'MyCfnIdentitySource', {
            configuration: {
                cognitoUserPoolConfiguration: {
                  userPoolArn: props.userPoolArn,
                },
              },
              policyStoreId: policyStore.attrPolicyStoreId,
              principalEntityType: "TenantServerlessSaaSAPI::User",
        });

        new CfnPolicy(scope, "OrderandProductServicePolicy", {
            definition: {
                static: {
                    statement:`permit(
                        principal,
                        action in [ TenantServerlessSaaSAPI::Action::"delete /orders/{id}", TenantServerlessSaaSAPI::Action::"delete /products/{id}", TenantServerlessSaaSAPI::Action::"get /orders", TenantServerlessSaaSAPI::Action::"get /orders/{id}", TenantServerlessSaaSAPI::Action::"get /products", TenantServerlessSaaSAPI::Action::"get /products/{id}", TenantServerlessSaaSAPI::Action::"post /orders", TenantServerlessSaaSAPI::Action::"post /products", TenantServerlessSaaSAPI::Action::"put /orders/{id}", TenantServerlessSaaSAPI::Action::"put /products/{id}" ],
                        resource
                        );`,
                    description: 'Allow access to Order and Product service for all tiers',
                }
            },
            policyStoreId: policyStore.attrPolicyStoreId,
        });


        new CfnPolicy(scope, "UserServicePolicy", {
            definition: {
                static: {
                    statement:`permit(
                        principal,
                        action in [ TenantServerlessSaaSAPI::Action::"put /users/{username}", TenantServerlessSaaSAPI::Action::"get /users/{username}", TenantServerlessSaaSAPI::Action::"get /users", TenantServerlessSaaSAPI::Action::"post /users"],
                        resource
                        )
                        when { principal["custom:userRole"] == "TenantAdmin" };`,
                    description: 'Allow access to User service for Tenant admin',
                }
            },
            policyStoreId: policyStore.attrPolicyStoreId,
        });

        //-------------------------------------------------------------------------
        //Lab2 - Policy for Promotions microservice to allow premium tier customers
        //-------------------------------------------------------------------------
        new CfnPolicy(scope, "PromotionServicePolicy", {
            definition: {
                static: {
                    statement:`permit (
                        principal,
                        action in
                            [TenantServerlessSaaSAPI::Action::"delete /promotions/{id}",
                            TenantServerlessSaaSAPI::Action::"get /promotions",
                            TenantServerlessSaaSAPI::Action::"get /promotions/{id}",
                            TenantServerlessSaaSAPI::Action::"post /promotions",
                            TenantServerlessSaaSAPI::Action::"put /promotions/{id}"],
                        resource
                    )
                    when { principal["custom:tenantTier"] == "premium" };`,
                    description: 'Access to promotion service for premium tier',
                }
            },
            policyStoreId: policyStore.attrPolicyStoreId,
        });

        this.policyStoreId = policyStore.attrPolicyStoreId;
    }

}

const cedarJsonSchema = {
    "TenantServerlessSaaSAPI": {
        "commonTypes": {},
        "actions": {
            "get /promotions/{id}": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "attributes": {},
                        "type": "Record"
                    }
                }
            },
            "delete /orders/{id}": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    }
                }
            },
            "get /orders": {
                "appliesTo": {
                    "context": {
                        "attributes": {},
                        "type": "Record"
                    },
                    "resourceTypes": [
                        "Application"
                    ],
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "get /products": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "attributes": {},
                        "type": "Record"
                    }
                }
            },
            "get /promotions": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    }
                }
            },
            "get /products/{id}": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "post /products": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "attributes": {},
                        "type": "Record"
                    },
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "put /orders/{id}": {
                "appliesTo": {
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "principalTypes": [
                        "User"
                    ],
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "post /orders": {
                "appliesTo": {
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ],
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "put /promotions/{id}": {
                "appliesTo": {
                    "context": {
                        "attributes": {},
                        "type": "Record"
                    },
                    "resourceTypes": [
                        "Application"
                    ],
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "delete /promotions/{id}": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    }
                }
            },
            "delete /products/{id}": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "get /orders/{id}": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "post /promotions": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "put /products/{id}": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "post /users": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "get /users": {
                "appliesTo": {
                    "principalTypes": [
                        "User"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "resourceTypes": [
                        "Application"
                    ]
                }
            },
            "get /users/{username}": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "principalTypes": [
                        "User"
                    ]
                }
            },
            "put /users/{username}": {
                "appliesTo": {
                    "resourceTypes": [
                        "Application"
                    ],
                    "context": {
                        "type": "Record",
                        "attributes": {}
                    },
                    "principalTypes": [
                        "User"
                    ]
                }
            }
        },
        "entityTypes": {
            "User": {
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "custom:tenantTier": {
                            "type": "String",
                            "required": true
                        },
                        "custom:userRole": {
                            "type": "String",
                            "required": true
                        }
                    }
                },
                "memberOfTypes": []
            },
            "Application": {
                "shape": {
                    "attributes": {},
                    "type": "Record"
                }
            }
        }
    }
};