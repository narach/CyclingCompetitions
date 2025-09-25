locals {
  lambda_architecture = "arm64"
  lambda_runtime      = "nodejs20.x"
  lambda_env = {
    SSM_ADMIN_LOGIN_PARAM    = aws_ssm_parameter.admin_login.name
    SSM_ADMIN_PASSWORD_PARAM = aws_ssm_parameter.admin_password.name
    SSM_DB_URL_PARAM         = aws_ssm_parameter.db_connection_string.name
    DB_MAX_POOL              = "2"
    SERVICE_NAME             = var.service_tag
  }
}

resource "null_resource" "events_create_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-create/package.json")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-create"
    command     = "npm install --omit=dev"
  }
}

data "archive_file" "events_create" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/events-create"
  output_path = "${path.module}/../lambdas/events-create/package.zip"
  depends_on  = [null_resource.events_create_npm]
}

resource "null_resource" "registrations_create_build" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/registrations-create/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/registrations-create/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/registrations-create/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/registrations-create"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "registrations_create_built" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/registrations-create"
  output_path = "${path.module}/../lambdas/registrations-create/package.zip"
  depends_on  = [null_resource.registrations_create_build]
}

data "archive_file" "registrations_list" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/registrations-list"
  output_path = "${path.module}/../lambdas/registrations-list/package.zip"
}

resource "null_resource" "events_list_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-list/package.json")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-list"
    command     = "npm install --omit=dev"
  }
}

data "archive_file" "events_list" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/events-list"
  output_path = "${path.module}/../lambdas/events-list/package.zip"
  depends_on  = [null_resource.events_list_npm]
}

resource "aws_cloudwatch_log_group" "lambda_events_create" {
  name              = "/aws/lambda/${var.service_tag}-events-create"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_registrations_create" {
  name              = "/aws/lambda/${var.service_tag}-registrations-create"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_registrations_list" {
  name              = "/aws/lambda/${var.service_tag}-registrations-list"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_events_list" {
  name              = "/aws/lambda/${var.service_tag}-events-list"
  retention_in_days = 7
}

resource "aws_lambda_function" "events_create" {
  function_name = "${var.service_tag}-events-create"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.events_create.output_path
  source_code_hash = filebase64sha256(data.archive_file.events_create.output_path)
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_events_create]
}

resource "aws_lambda_function" "registrations_create" {
  function_name = "${var.service_tag}-registrations-create"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.registrations_create_built.output_path
  source_code_hash = filebase64sha256(data.archive_file.registrations_create_built.output_path)
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_registrations_create]
}

resource "aws_lambda_function" "registrations_list" {
  function_name = "${var.service_tag}-registrations-list"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.registrations_list.output_path
  source_code_hash = filebase64sha256(data.archive_file.registrations_list.output_path)
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_registrations_list]
}

resource "aws_lambda_function" "events_list" {
  function_name = "${var.service_tag}-events-list"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.events_list.output_path
  source_code_hash = filebase64sha256(data.archive_file.events_list.output_path)
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_events_list]
}

resource "aws_lambda_function_event_invoke_config" "events_create" {
  function_name = aws_lambda_function.events_create.function_name
  maximum_retry_attempts = 0
}

resource "aws_lambda_function_event_invoke_config" "registrations_create" {
  function_name = aws_lambda_function.registrations_create.function_name
  maximum_retry_attempts = 0
}

resource "aws_lambda_function_event_invoke_config" "registrations_list" {
  function_name = aws_lambda_function.registrations_list.function_name
  maximum_retry_attempts = 0
}

