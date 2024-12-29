output "bucket_name" {
  value = aws_s3_bucket.video_bucket.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.video_api.api_endpoint
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.video_distribution.domain_name
}

output "static_website_url" {
  value = "http://${aws_s3_bucket.video_bucket.bucket}.s3-website-${var.region}.amazonaws.com"
  description = "URL of the S3 static website hosting"
}
output "region" {
  value = var.region
}
output "api_gateway_upload_url" {
  value       = "${aws_apigatewayv2_api.video_api.api_endpoint}/upload"
  description = "API Gateway endpoint for video upload"
}

output "api_gateway_fetch_url" {
  value       = "${aws_apigatewayv2_api.video_api.api_endpoint}/fetch"
  description = "API Gateway endpoint for fetching videos"
}