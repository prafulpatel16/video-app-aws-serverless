output "bucket_name" {
  value = aws_s3_bucket.video_bucket.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.video_api.api_endpoint
}


# Outputs
output "s3_static_website_url" {
  value = "http://${aws_s3_bucket.video_bucket.bucket}.s3-website-${var.region}.amazonaws.com"
  description = "S3 static website hosting URL"
}

output "api_gateway_upload_url" {
  value = "${aws_apigatewayv2_api.video_api.api_endpoint}/upload"
  description = "API Gateway endpoint for video upload"
}

output "api_gateway_fetch_url" {
  value = "${aws_apigatewayv2_api.video_api.api_endpoint}/fetch"
  description = "API Gateway endpoint for fetching videos"
}

