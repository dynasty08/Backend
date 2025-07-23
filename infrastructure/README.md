# Auto-Deployment Pipeline Setup

This sets up AWS CodePipeline to automatically deploy your serverless backend when you push to GitHub.

## Prerequisites

1. **AWS CLI configured** with credentials that have permissions for:
   - CloudFormation
   - CodePipeline, CodeBuild
   - IAM, Lambda, API Gateway, S3

2. **GitHub Personal Access Token** with permissions:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Read/write repository hooks)

## Quick Setup

1. **Create GitHub token:**
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate new token with required permissions above

2. **Deploy pipeline:**
   ```bash
   cd infrastructure
   chmod +x deploy-pipeline.sh
   ./deploy-pipeline.sh your-github-username/your-repo-name your-github-token
   ```

3. **Push changes to main branch** - pipeline will automatically trigger!

## Manual Deployment

```bash
aws cloudformation deploy \
    --template-file pipeline.yml \
    --stack-name my-backend-pipeline \
    --parameter-overrides \
        GitHubRepo=your-username/your-repo-name \
        GitHubToken=your-github-token \
        GitHubBranch=main \
    --capabilities CAPABILITY_IAM \
    --region ap-southeast-1
```

## How It Works

1. **Source**: Monitors your GitHub repository
2. **Build**: Runs `buildspec-build.yml` (installs dependencies)
3. **Deploy**: Runs `buildspec-deploy.yml` (serverless deploy)

## Pipeline Stages

- **Source** → **Build** → **Deploy**
- Triggers on every push to main branch
- Uses your existing buildspec files
- Deploys to `dev` stage automatically

## Cleanup

```bash
aws cloudformation delete-stack --stack-name my-backend-pipeline --region ap-southeast-1
```
