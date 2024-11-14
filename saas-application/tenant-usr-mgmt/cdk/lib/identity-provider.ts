// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_cognito, StackProps,Stack,RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IdentityDetails } from '../interfaces/identity-details';
import * as iam from 'aws-cdk-lib/aws-iam';

export class IdentityProvider extends Construct {
  public readonly identityDetails: IdentityDetails;
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id);


    // Resources
    const tenantUserPool = new aws_cognito.UserPool(this, 'tenantUserPool', {
      autoVerify: { email: true },
      accountRecovery: aws_cognito.AccountRecovery.EMAIL_ONLY,
      userPoolName:'PooledTenantsUserPool',
      advancedSecurityMode: aws_cognito.AdvancedSecurityMode.ENFORCED,
      removalPolicy: RemovalPolicy.DESTROY,
      passwordPolicy: {
        minLength: 8,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        tenantId: new aws_cognito.StringAttribute({
          mutable: true,
        }),
        userRole: new aws_cognito.StringAttribute({
          mutable: true,
        }),
        tenantTier: new aws_cognito.StringAttribute({
          mutable: true,
        }),        
        
      },
    });



    const writeAttributes = new aws_cognito.ClientAttributes()
      .withStandardAttributes({ email: true })
      .withCustomAttributes('tenantId', 'userRole');

    const tenantUserPoolClient = new aws_cognito.UserPoolClient(this, 'tenantUserPoolClient', {
      userPool: tenantUserPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        adminUserPassword: true,
        userSrp: true,
        custom: false,
      },
      writeAttributes: writeAttributes,
      oAuth: {
        scopes: [
          aws_cognito.OAuthScope.EMAIL,
          aws_cognito.OAuthScope.OPENID,
          aws_cognito.OAuthScope.PROFILE,
        ],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
      },
    });    

    const cognitoIdentityPool = new aws_cognito.CfnIdentityPool(this, 'CognitoIdentityPool', {
      identityPoolName: 'PooledTenant-SaaSOperationsIdentityPool',
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: tenantUserPoolClient.userPoolClientId,
          providerName: tenantUserPool.userPoolProviderName,
          serverSideTokenCheck: true,
        },
      ],
    });

    const authenticatedPooledUserRole = new iam.CfnRole(this, 'AuthenticatedPooledUserRole', {
      roleName: 'authenticated-pooled-user-role',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
              },              
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': `${cognitoIdentityPool.attrId}`
              }
            },
          },
          {
            Effect: 'Allow',
            Principal: {
              Federated: 'cognito-identity.amazonaws.com',
            },
            Action: 'sts:TagSession',
            Condition: {
              'ForAnyValue:StringLike': {
                'cognito-identity.amazonaws.com:amr': 'authenticated',
              },
              StringEquals: {
                'cognito-identity.amazonaws.com:aud': `${cognitoIdentityPool.attrId}`
              }              
            },
          },
        ]
      },
      policies: [
        {
          policyName: 'authenticated-pooled-user-policy',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:UpdateItem',
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                ],
                Resource: [
                  `arn:aws:dynamodb:${Stack.of(this).region}:${Stack.of(this).account}:table/ProductService-pooled`,
                  `arn:aws:dynamodb:${Stack.of(this).region}:${Stack.of(this).account}:table/OrderService-pooled`,
                  `arn:aws:dynamodb:${Stack.of(this).region}:${Stack.of(this).account}:table/PromotionService-pooled`
                ],
                //
                //Lab3 - Add dynamodb LeadingKeys condition to allow access based on tenant id
                //
                /*Condition: {
                  'ForAllValues:StringLike': {
                    'dynamodb:LeadingKeys': [
                      '${aws:PrincipalTag/tenantId}-*',
                    ],
                  },
                },*/
              }         
            ]
          },
        },
      ],
    });

    const cognitoUserPoolIdentityProvider = new aws_cognito.CfnUserPoolIdentityProvider(this, 'CognitoUserPoolIdentityProvider', {
      providerName: 'Cognito',
      providerType: 'OIDC',
      userPoolId: tenantUserPool.userPoolId,
      providerDetails: {
        'client_id': tenantUserPoolClient.userPoolClientId,
        'authorize_scopes': 'email openid profile',
        'attributes_request_method': 'GET',
        'oidc_issuer': tenantUserPool.userPoolProviderUrl,
      },
    });

    const cognitoIdentityPoolRoleAttachement = new aws_cognito.CfnIdentityPoolRoleAttachment(this, 'CognitoIdentityPoolRoleAttachement', {
      identityPoolId: cognitoIdentityPool.attrId,
      roles: {
        authenticated: authenticatedPooledUserRole.attrArn,
      },
    });

    const pooledUserPrincipalTagMapping = new aws_cognito.CfnIdentityPoolPrincipalTag(this, 'PooledUserPrincipalTagMapping', {
      identityPoolId: cognitoIdentityPool.attrId,
      identityProviderName: tenantUserPool.userPoolProviderName,
      useDefaults: false,
      principalTags: {
        tenantId: 'custom:tenantId',
        userRole: 'custom:userRole',
      },
    });

    this.identityDetails = {
      name: 'Cognito',
      details: {
        userPoolId: tenantUserPool.userPoolId,
        userPoolArn : tenantUserPool.userPoolArn,
        appClientId: tenantUserPoolClient.userPoolClientId,
        identityPoolId: cognitoIdentityPool.attrId
      },
    };
  }
}