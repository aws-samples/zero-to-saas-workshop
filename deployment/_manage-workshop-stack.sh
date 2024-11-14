#!/bin/bash
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

create_workshop() {
    
    get_vscodeserver_id
    
    echo "Waiting for " $VSSERVER_ID
    aws ec2 start-instances --instance-ids "$VSSERVER_ID"
    aws ec2 wait instance-status-ok --instance-ids "$VSSERVER_ID"
    echo $VSSERVER_ID "ready"

    ##TODO
    #replace_instance_profile $BUILD_VSCODE_SERVER_PROFILE_PARAMETER_NAME
    
    run_ssm_command ". ~/.bashrc"
    run_ssm_command "cd ~ ; git clone --branch $REPO_BRANCH_NAME $REPO_URL || echo 'Repo already exists.'"
    run_ssm_command "cd ~/$REPO_NAME && git config core.filemode false"
    run_ssm_command "cd ~/$REPO_NAME && chmod +x . -R"
    run_ssm_command "cd ~/$REPO_NAME/deployment && ./create-workshop.sh $REPO_URL | tee .ws-create.log"
    run_ssm_command "cd ~/$REPO_NAME && rm -rf .git"
    run_ssm_command "cd ~/$REPO_NAME && git init && git add . && git commit -m 'Init' && git tag -a base HEAD -m 'Base commit for workshop'"
    replace_instance_profile $PARTICIPANT_VSCODE_SERVER_PROFILE_PARAMETER_NAME

}

delete_workshop() {
    ##TODO
    ##./delete-workshop.sh
    echo "##TODO"
}
