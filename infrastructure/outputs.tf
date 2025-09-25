output "api_endpoint" {
  description = "HTTP API invoke URL"
  value       = aws_apigatewayv2_api.http_api.api_endpoint
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "site_bucket" {
  description = "S3 bucket for site"
  value       = aws_s3_bucket.site.id
}

output "hosted_zone_id" {
  description = "Route53 hosted zone id"
  value       = aws_route53_zone.root.zone_id
}

