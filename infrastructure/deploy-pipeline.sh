#!/bin/bash

# Deploy CodePipeline CloudFormation stack
# Usage: ./deploy-pipeline.sh <github-username/repo-name> <github-token>

set -e

GITHUB_REPO=${1:-"your-username/your-repo-name"}
GITHUB_TOKEN=${2}
STACK_NAME="my-backend-pipeline"
REGION="ap-southeast-1"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GitHub token is required"
    echo "Usage: ./deploy-pipeline.sh <github-username/repo-name> <github-token>"
    echo ""
    echo "To create GitHub token:"
    echo "1. Go to GitHub Settings > Developer settings > Personal access tokens"
    echo "2. Generate new token with 'repo' and 'admin:repo_hook' permissions"
    exit 1
fi

echo "Deploying CodePipeline stack..."
echo "Repository: $GITHUB_REPO"
echo "Region: $REGION"
echo "Stack Name: $STACK_NAME"

aws cloudformation deploy \
    --template-file pipeline.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        GitHubRepo=$GITHUB_REPO \
        GitHubToken=$GITHUB_TOKEN \
        GitHubBranch=main \
    --capabilities CAPABILITY_IAM \
    --region $REGION

echo ""
echo "✅ Pipeline deployed successfully!"
echo ""
echo "Pipeline URL:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PipelineUrl`].OutputValue' \
    --output text

echo ""
echo "🚀 Your auto-deployment pipeline is now active!"
echo "Push changes to the main branch to trigger deployment."
