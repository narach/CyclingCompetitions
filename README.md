## cycling-mne Terraform stack

This Terraform stack provisions a minimal, cost-conscious MVP backend and hosting for cycling competitions in Montenegro.

### Components
- HTTP API (API Gateway v2) with routes to three Lambda functions
- Three Lambda functions (Node.js 20, ARM64), public egress (no VPC)
- SSM Parameter Store: adminLogin, adminPassword, dbConnectionString
- CloudWatch logs with 7-day retention for Lambdas and API access logs
- S3 bucket for static site with `data/` prefix for static content and OAC-protected CloudFront distribution
- Route53 hosted zone and records for `app.<root_domain>`
- ACM certificate in us-east-1 for CloudFront
- AWS Resource Group filtering by tag `service_name=cycling-mne`

### Cost notes
- No NAT Gateway (Lambdas are not in a VPC)
- HTTP API (not REST) to minimize cost
- Reserved concurrency (2) on each Lambda to limit DB connections

### Prereqs
- Terraform >= 1.5
- AWS credentials set for your target account

### Configure
Create a `terraform.tfvars` file:

```
root_domain           = "yourdomain.tld"
app_subdomain         = "app"
admin_login           = "admin"
admin_password        = "CHANGE_ME"
db_connection_string  = "postgres://user:pass@host/db"
aws_region            = "eu-central-1"
```

### Deploy (from infrastructure directory)
```
cd infrastructure
terraform init
terraform plan
terraform apply
```

After apply:
- Upload your built SPA to the S3 bucket output. Static data goes under `data/`.
- Route53 name servers will be returned for the hosted zone; set them at your domain registrar if needed.

### Use a specific AWS CLI profile (e.g., personal-eureka)
Terraform's AWS provider uses AWS CLI profiles when `AWS_PROFILE` is set. Run Terraform in a shell with your profile exported:

PowerShell (Windows):
```
$env:AWS_PROFILE = "personal-eureka"
cd infrastructure
terraform init -reconfigure
terraform plan
terraform apply
```

Bash (macOS/Linux/Git Bash):
```
export AWS_PROFILE=personal-eureka
cd infrastructure
terraform init -reconfigure
terraform plan
terraform apply
```

Notes:
- This applies to both the default region and the us-east-1 aliased provider used for the CloudFront ACM certificate.
- To switch accounts, change `AWS_PROFILE` in the same shell.

### Endpoints
- POST /events
- GET  /events
- POST /registrations
- GET  /registrations

### Environment for Lambdas
- Reads SSM parameters at runtime; keep pool at max 2 via `DB_MAX_POOL`.


