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
        s3.put_object(Bucket=BUCKET_NAME, Key=file_name, Body=file_content)

        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'videoId': file_name,
                'url': f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}",
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Video uploaded successfully!'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
