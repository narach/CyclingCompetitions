variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Human-friendly project name"
  type        = string
  default     = "cycling-competitions"
}

variable "service_tag" {
  description = "Service name tag value for all resources"
  type        = string
  default     = "cycling-mne"
}

variable "root_domain" {
  description = "Root domain to host (e.g. example.com). Must be managed in Route53 after zone creation."
  type        = string
}

variable "app_subdomain" {
  description = "Subdomain for the web app (e.g. app)"
  type        = string
  default     = "app"
}

variable "admin_login" {
  description = "Initial admin login to store in SSM"
  type        = string
  sensitive   = true
}

variable "admin_password" {
  description = "Initial admin password to store in SSM"
  type        = string
  sensitive   = true
}

variable "db_connection_string" {
  description = "PostgreSQL connection string for Neon (e.g. postgres://user:pass@host/db)"
  type        = string
  sensitive   = true
}

variable "lambda_memory_mb" {
  description = "Lambda memory size"
  type        = number
  default     = 128
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 10
}

variable "throttling_burst_limit" {
  description = "API Gateway HTTP API default burst limit"
  type        = number
  default     = 10
}

variable "throttling_rate_limit" {
  description = "API Gateway HTTP API default steady-state rate limit (requests per second)"
  type        = number
  default     = 5
}

