variable "region" {
  default = "us-east-1"
}

variable "video_bucket_name" {
  default = "video-upload-bucket"
}

variable "dynamodb_table_name" {
  default = "video-metadata"
}