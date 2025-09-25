param(
  [Parameter(Mandatory=$true)][string]$BucketName,
  [string]$DistributionId
)

$ErrorActionPreference = 'Stop'

Write-Host "Building UI..."
Push-Location ui
npm install
npm run build
Pop-Location

Write-Host "Syncing to s3://$BucketName (preserving /data)..."
aws s3 sync ./ui/dist/ s3://$BucketName --delete --exclude "data/*" --exclude "data"

if ($DistributionId -and $DistributionId.Trim().Length -gt 0) {
  Write-Host "Invalidating CloudFront distribution $DistributionId..."
  aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*" | Out-Null
}

Write-Host "Done."

