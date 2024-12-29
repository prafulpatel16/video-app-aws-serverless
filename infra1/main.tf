provider "aws" {
  region = var.region
}


# Generate a unique string for the bucket name
resource "random_string" "bucket_suffix" {
  length  = 6
  special = false
  upper   = false
}

# S3 Bucket for Static Website and Video Storage
resource "aws_s3_bucket" "video_bucket" {
  bucket = "${replace(var.video_bucket_name, "/[^a-zA-Z0-9._-]/", "")}-${random_string.bucket_suffix.id}"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
  }
}


resource "aws_s3_bucket_public_access_block" "video_bucket_access_block" {
  bucket                  = aws_s3_bucket.video_bucket.id
  block_public_acls       = false
  ignore_public_acls      = false
  block_public_policy     = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "video_bucket_policy" {
  bucket = aws_s3_bucket.video_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.video_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_s3_object" "static_files" {
  for_each = fileset("static-web", "*")

  bucket = aws_s3_bucket.video_bucket.id
  key    = each.key
  source = "static-web/${each.key}"
  etag   = filemd5("static-web/${each.key}")
  content_type = lookup(
    {
      "html" = "text/html",
      "js"   = "application/javascript",
      "css"  = "text/css"
    },
    split(".", each.key)[length(split(".", each.key)) - 1],
    "application/octet-stream"
  )
}
resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.video_bucket.id

  index_document {
    suffix = "index.html"
  }
}


# DynamoDB Table for Metadata
resource "aws_dynamodb_table" "video_metadata" {
  name         = var.dynamodb_table_name
  hash_key     = "videoId"
  billing_mode = "PAY_PER_REQUEST"

  attribute {
    name = "videoId"
    type = "S"
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "lambda_execution_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy_attachment" "lambda_policy_attachment" {
  name       = "lambda_policy_attachment"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_policy_attachment" "lambda_s3_policy" {
  name       = "lambda_s3_policy"
  roles      = [aws_iam_role.lambda_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# Lambda Functions
resource "aws_lambda_function" "upload_handler" {
  function_name = "video-upload-handler"
  runtime       = "python3.9"
  role          = aws_iam_role.lambda_role.arn
  handler       = "upload_handler.lambda_handler"

  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")

  environment {
    variables = {
      BUCKET_NAME = aws_s3_bucket.video_bucket.id
      TABLE_NAME  = aws_dynamodb_table.video_metadata.name
    }
  }
}

resource "aws_lambda_function" "fetch_handler" {
  function_name = "video-fetch-handler"
  runtime       = "python3.9"
  role          = aws_iam_role.lambda_role.arn
  handler       = "fetch_handler.lambda_handler"

  filename         = "lambda.zip"
  source_code_hash = filebase64sha256("lambda.zip")

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.video_metadata.name
    }
  }
}

# API Gateway
resource "aws_apigatewayv2_api" "video_api" {
  name          = "video-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "upload_integration" {
  api_id             = aws_apigatewayv2_api.video_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.upload_handler.invoke_arn
}

resource "aws_apigatewayv2_integration" "fetch_integration" {
  api_id             = aws_apigatewayv2_api.video_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.fetch_handler.invoke_arn
}

resource "aws_apigatewayv2_route" "upload_route" {
  api_id    = aws_apigatewayv2_api.video_api.id
  route_key = "POST /upload"
  target    = "integrations/${aws_apigatewayv2_integration.upload_integration.id}"
}

resource "aws_apigatewayv2_route" "fetch_route" {
  api_id    = aws_apigatewayv2_api.video_api.id
  route_key = "GET /fetch"
  target    = "integrations/${aws_apigatewayv2_integration.fetch_integration.id}"
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.video_api.id
  name        = "prod"
  auto_deploy = true
}

# Local Update of Static Website with API Gateway URLs
resource "null_resource" "update_static_site" {
  provisioner "local-exec" {
    command = <<EOT
    UPLOAD_URL=$(terraform output -raw api_gateway_upload_url)
    FETCH_URL=$(terraform output -raw api_gateway_fetch_url)

    if [ ! -f "static-web/app.js" ]; then
      echo "static-web/app.js does not exist. Aborting."
      exit 1
    fi

    sed -i "s|YOUR_API_GATEWAY_UPLOAD_URL|$UPLOAD_URL|g" static-web/app.js
    sed -i "s|YOUR_API_GATEWAY_FETCH_URL|$FETCH_URL|g" static-web/app.js

    aws s3 sync static-web/ s3://${aws_s3_bucket.video_bucket.bucket}
    EOT
  }

  depends_on = [
    aws_s3_bucket.video_bucket,
    aws_apigatewayv2_stage.api_stage
  ]
}


