locals {
  api_name = "${var.service_tag}-http-api"
}

resource "aws_apigatewayv2_api" "http_api" {
  name          = local.api_name
  protocol_type = "HTTP"
  cors_configuration {
    allow_headers = ["content-type", "authorization"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_origins = ["https://${var.app_subdomain}.${var.root_domain}", "http://localhost:3000"]
  }
}

resource "aws_cloudwatch_log_group" "http_api_access" {
  name              = "/aws/apigateway/${local.api_name}-access"
  retention_in_days = 7
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.http_api_access.arn
    format = jsonencode({
      requestId      = "$context.requestId",
      ip             = "$context.identity.sourceIp",
      requestTime    = "$context.requestTime",
      httpMethod     = "$context.httpMethod",
      routeKey       = "$context.routeKey",
      status         = "$context.status",
      responseLength = "$context.responseLength"
    })
  }
}

resource "aws_apigatewayv2_integration" "events_create" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.events_create.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "registrations_create" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.registrations_create.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "registrations_list" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.registrations_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "events_list" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.events_list.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "events_create" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /events"
  target    = "integrations/${aws_apigatewayv2_integration.events_create.id}"
}

resource "aws_apigatewayv2_route" "registrations_create" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /registrations"
  target    = "integrations/${aws_apigatewayv2_integration.registrations_create.id}"
}

resource "aws_apigatewayv2_route" "registrations_list" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /registrations"
  target    = "integrations/${aws_apigatewayv2_integration.registrations_list.id}"
}

resource "aws_apigatewayv2_route" "events_list" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "GET /events"
  target    = "integrations/${aws_apigatewayv2_integration.events_list.id}"
}

resource "aws_lambda_permission" "apigw_events_create" {
  statement_id  = "AllowInvokeByApiGatewayEventsCreate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.events_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_registrations_create" {
  statement_id  = "AllowInvokeByApiGatewayRegistrationsCreate"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.registrations_create.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_registrations_list" {
  statement_id  = "AllowInvokeByApiGatewayRegistrationsList"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.registrations_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "apigw_events_list" {
  statement_id  = "AllowInvokeByApiGatewayEventsList"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.events_list.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

