locals {
  lambda_architecture = "arm64"
  lambda_runtime      = "nodejs20.x"
  lambda_env = {
    SSM_ADMIN_LOGIN_PARAM    = aws_ssm_parameter.admin_login.name
    SSM_ADMIN_PASSWORD_PARAM = aws_ssm_parameter.admin_password.name
    SSM_DB_URL_PARAM         = aws_ssm_parameter.db_connection_string.name
    DB_MAX_POOL              = "2"
    SERVICE_NAME             = var.service_tag
    ROUTES_BUCKET            = aws_s3_bucket.routes.id
  }
}

resource "null_resource" "events_create_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-create/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/events-create/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/events-create/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-create"
    command     = "npm install && npm run build && npm prune --omit=dev"
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
  depends_on  = [null_resource.registrations_list_build]
}

resource "null_resource" "events_list_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-list/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/events-list/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/events-list/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-list"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "events_list" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/events-list"
  output_path = "${path.module}/../lambdas/events-list/package.zip"
  depends_on  = [null_resource.events_list_npm]
}

resource "null_resource" "events_update_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-update/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/events-update/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/events-update/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-update"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "events_update" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/events-update"
  output_path = "${path.module}/../lambdas/events-update/package.zip"
  depends_on  = [null_resource.events_update_npm]
}

resource "null_resource" "events_delete_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/events-delete/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/events-delete/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/events-delete/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/events-delete"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "events_delete" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/events-delete"
  output_path = "${path.module}/../lambdas/events-delete/package.zip"
  depends_on  = [null_resource.events_delete_npm]
}

resource "null_resource" "auth_admin_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/auth-admin/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/auth-admin/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/auth-admin/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/auth-admin"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

# Build step for registrations-list (TypeScript)
resource "null_resource" "registrations_list_build" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/registrations-list/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/registrations-list/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/registrations-list/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/registrations-list"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "auth_admin" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/auth-admin"
  output_path = "${path.module}/../lambdas/auth-admin/package.zip"
  depends_on  = [null_resource.auth_admin_npm]
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
  source_code_hash = data.archive_file.events_create.output_base64sha256
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
  source_code_hash = data.archive_file.registrations_create_built.output_base64sha256
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
  source_code_hash = data.archive_file.registrations_list.output_base64sha256
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
  source_code_hash = data.archive_file.events_list.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_events_list]
}

resource "aws_lambda_function" "events_update" {
  function_name = "${var.service_tag}-events-update"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.events_update.output_path
  source_code_hash = data.archive_file.events_update.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
}

resource "aws_lambda_function" "events_delete" {
  function_name = "${var.service_tag}-events-delete"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.events_delete.output_path
  source_code_hash = data.archive_file.events_delete.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
}

resource "aws_lambda_function" "auth_admin" {
  function_name = "${var.service_tag}-auth-admin"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.auth_admin.output_path
  source_code_hash = data.archive_file.auth_admin.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
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

# =========================
# Routes Lambdas (build & zip)
# =========================

resource "null_resource" "routes_create_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/routes/routes-create/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/routes/routes-create/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/routes/routes-create/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/routes/routes-create"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "routes_create" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/routes/routes-create"
  output_path = "${path.module}/../lambdas/routes/routes-create/package.zip"
  depends_on  = [null_resource.routes_create_npm]
}

resource "null_resource" "routes_update_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/routes/routes-update/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/routes/routes-update/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/routes/routes-update/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/routes/routes-update"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "routes_update" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/routes/routes-update"
  output_path = "${path.module}/../lambdas/routes/routes-update/package.zip"
  depends_on  = [null_resource.routes_update_npm]
}

resource "null_resource" "routes_delete_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/routes/routes-delete/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/routes/routes-delete/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/routes/routes-delete/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/routes/routes-delete"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "routes_delete" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/routes/routes-delete"
  output_path = "${path.module}/../lambdas/routes/routes-delete/package.zip"
  depends_on  = [null_resource.routes_delete_npm]
}

resource "null_resource" "routes_list_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/routes/routes-list/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/routes/routes-list/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/routes/routes-list/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/routes/routes-list"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "routes_list" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/routes/routes-list"
  output_path = "${path.module}/../lambdas/routes/routes-list/package.zip"
  depends_on  = [null_resource.routes_list_npm]
}

resource "null_resource" "routes_get_by_id_npm" {
  triggers = {
    package_json_sha = filesha1("${path.module}/../lambdas/routes/routes-get-by-id/package.json")
    tsconfig_sha     = filesha1("${path.module}/../lambdas/routes/routes-get-by-id/tsconfig.json")
    src_sha          = filesha1("${path.module}/../lambdas/routes/routes-get-by-id/src/index.ts")
  }
  provisioner "local-exec" {
    working_dir = "${path.module}/../lambdas/routes/routes-get-by-id"
    command     = "npm install && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "routes_get_by_id" {
  type        = "zip"
  source_dir  = "${path.module}/../lambdas/routes/routes-get-by-id"
  output_path = "${path.module}/../lambdas/routes/routes-get-by-id/package.zip"
  depends_on  = [null_resource.routes_get_by_id_npm]
}

# =========================
# Routes Lambdas (logs + functions)
# =========================

resource "aws_cloudwatch_log_group" "lambda_routes_create" {
  name              = "/aws/lambda/${var.service_tag}-routes-create"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_routes_update" {
  name              = "/aws/lambda/${var.service_tag}-routes-update"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_routes_delete" {
  name              = "/aws/lambda/${var.service_tag}-routes-delete"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_routes_list" {
  name              = "/aws/lambda/${var.service_tag}-routes-list"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "lambda_routes_get_by_id" {
  name              = "/aws/lambda/${var.service_tag}-routes-get-by-id"
  retention_in_days = 7
}

resource "aws_lambda_function" "routes_create" {
  function_name = "${var.service_tag}-routes-create"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.routes_create.output_path
  source_code_hash = data.archive_file.routes_create.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_routes_create]
}

resource "aws_lambda_function" "routes_update" {
  function_name = "${var.service_tag}-routes-update"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.routes_update.output_path
  source_code_hash = data.archive_file.routes_update.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_routes_update]
}

resource "aws_lambda_function" "routes_delete" {
  function_name = "${var.service_tag}-routes-delete"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.routes_delete.output_path
  source_code_hash = data.archive_file.routes_delete.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_routes_delete]
}

resource "aws_lambda_function" "routes_list" {
  function_name = "${var.service_tag}-routes-list"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.routes_list.output_path
  source_code_hash = data.archive_file.routes_list.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_routes_list]
}

resource "aws_lambda_function" "routes_get_by_id" {
  function_name = "${var.service_tag}-routes-get-by-id"
  role          = aws_iam_role.lambda_role.arn
  architectures = [local.lambda_architecture]
  runtime       = local.lambda_runtime
  handler       = "index.handler"
  filename      = data.archive_file.routes_get_by_id.output_path
  source_code_hash = data.archive_file.routes_get_by_id.output_base64sha256
  memory_size   = var.lambda_memory_mb
  timeout       = var.lambda_timeout_seconds
  reserved_concurrent_executions = 2
  environment {
    variables = local.lambda_env
  }
  depends_on = [aws_cloudwatch_log_group.lambda_routes_get_by_id]
}

