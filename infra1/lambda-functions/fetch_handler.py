import json
import boto3
import os

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ['TABLE_NAME']

def lambda_handler(event, context):
    try:
        # Get table reference
        table = dynamodb.Table(TABLE_NAME)
        # Scan the table
        response = table.scan()

        # Return success response with data
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-File-Name',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
            'body': json.dumps({
                'message': 'Success',
                'data': response.get('Items', [])  # Return the scanned items
            }),
        }
    except Exception as e:
        # Return error response
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-File-Name",
                "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            },
            "body": json.dumps({"error": str(e)}),
        }
