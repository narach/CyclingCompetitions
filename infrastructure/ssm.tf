resource "aws_ssm_parameter" "admin_login" {
  name        = "/${var.service_tag}/adminLogin"
  description = "Admin login for ${var.service_tag}"
  type        = "String"
  value       = var.admin_login
}

resource "aws_ssm_parameter" "admin_password" {
  name        = "/${var.service_tag}/adminPassword"
  description = "Admin password for ${var.service_tag}"
  type        = "SecureString"
  value       = var.admin_password
}

resource "aws_ssm_parameter" "db_connection_string" {
  name        = "/${var.service_tag}/dbConnectionString"
  description = "PostgreSQL connection string for ${var.service_tag}"
  type        = "SecureString"
  value       = var.db_connection_string
}

