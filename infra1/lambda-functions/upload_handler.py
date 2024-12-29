import json
import boto3
import uuid
import os

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ['BUCKET_NAME']
TABLE_NAME = os.environ['TABLE_NAME']

def lambda_handler(event, context):
    try:
        file_content = event['body']
        file_name = str(uuid.uuid4()) + ".mp4"

        # Upload to S3
        s3.put_object(Bucket=BUCKET_NAME, Key=file_name, Body=file_content, ContentType="video/mp4")

        # Save metadata to DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        video_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"
        table.put_item(
            Item={
                'videoId': file_name,
                'url': video_url
            }
        )

        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps({'message': 'Video uploaded successfully!', 'url': video_url})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps({'error': str(e)})
        }
