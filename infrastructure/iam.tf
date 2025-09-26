data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_role" {
  name               = "${var.service_tag}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "ssm_read" {
  statement {
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParameterHistory"
    ]
    resources = [
      aws_ssm_parameter.admin_login.arn,
      aws_ssm_parameter.admin_password.arn,
      aws_ssm_parameter.db_connection_string.arn
    ]
  }
}

resource "aws_iam_policy" "ssm_read" {
  name   = "${var.service_tag}-ssm-read"
  policy = data.aws_iam_policy_document.ssm_read.json
}

resource "aws_iam_role_policy_attachment" "lambda_ssm_read" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

data "aws_iam_policy_document" "s3_put_routes" {
  statement {
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl"
    ]
    resources = [
      "${aws_s3_bucket.routes.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "s3_put_routes" {
  name   = "${var.service_tag}-s3-put-routes"
  policy = data.aws_iam_policy_document.s3_put_routes.json
}

resource "aws_iam_role_policy_attachment" "lambda_s3_put_routes" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.s3_put_routes.arn
}

data "aws_iam_policy_document" "s3_delete_routes" {
  statement {
    effect = "Allow"
    actions = [
      "s3:DeleteObject"
    ]
    resources = [
      "${aws_s3_bucket.routes.arn}/*"
    ]
  }
}

resource "aws_iam_policy" "s3_delete_routes" {
  name   = "${var.service_tag}-s3-delete-routes"
  policy = data.aws_iam_policy_document.s3_delete_routes.json
}

resource "aws_iam_role_policy_attachment" "lambda_s3_delete_routes" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.s3_delete_routes.arn
}

