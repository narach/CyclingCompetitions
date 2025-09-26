resource "aws_s3_bucket" "routes" {
  bucket        = "${var.service_tag}-routes-${random_string.suffix.id}"
  force_destroy = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "routes" {
  bucket = aws_s3_bucket.routes.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "routes" {
  bucket                  = aws_s3_bucket.routes.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "routes_public_read" {
  bucket = aws_s3_bucket.routes.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: [
          "s3:GetObject"
        ],
        Resource: [
          "${aws_s3_bucket.routes.arn}/*"
        ]
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.routes]
}


