# AWS Serverless Video Upload and Play Application Deployment Guide

This guide provides a step-by-step process to manually deploy a serverless application for video upload and play functionality using AWS services.

---

## **Phase 1: Setting Up Amazon S3 for Video Storage**

### **Step 1: Create an S3 Bucket**
1. Log in to the [AWS Management Console](https://aws.amazon.com/console/).
2. Navigate to **S3** and click **Create Bucket**:
   - **Bucket Name**: `video-upload-bucket` (must be globally unique).
   - **Region**: Choose your region (e.g., `us-east-1`).
   - Enable **Block all public access** for security if required.
3. Click **Create Bucket**.

### **Step 2: Configure Permissions**
1. Go to the **Permissions** tab.
2. Add a **CORS Policy**:
   ```json
   {
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedOrigins": ["*"]
       }
     ]
   }
   ```
3. Add an optional **Bucket Policy** to allow Lambda access:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Service": "lambda.amazonaws.com"
         },
         "Action": "s3:*",
         "Resource": "arn:aws:s3:::video-upload-bucket/*"
       }
     ]
   }
   ```

### **Step 3: Enable Static Website Hosting**
1. Navigate to the **Properties** tab.
2. Enable **Static Website Hosting**:
   - Set **Index Document** to `index.html`.

---

## **Phase 2: Setting Up DynamoDB for Metadata Storage**

### **Step 1: Create a DynamoDB Table**
1. Navigate to **DynamoDB** > **Create Table**.
2. Configure the table:
   - **Table Name**: `video-metadata`.
   - **Partition Key**: `videoId` (String).
3. Leave other settings as default and click **Create Table**.

### **Step 2: Add Test Data**
1. Navigate to **Explore Table Items**.
2. Add a test item:
   ```json
   {
       "videoId": "sample-video-id",
       "url": "https://video-upload-bucket.s3.amazonaws.com/sample-video.mp4"
   }
   ```

---

## **Phase 3: Setting Up Lambda Functions**

### **Step 1: Create the Upload Handler**
1. Navigate to **Lambda** > **Create Function**:
   - Choose **Author from scratch**.
   - **Function Name**: `video-upload-handler`.
   - **Runtime**: Python 3.9.
2. Add the function code:
   ```python
   import boto3
   import os
   import json
   import uuid

   s3 = boto3.client('s3')
   dynamodb = boto3.resource('dynamodb')

   BUCKET_NAME = os.environ['BUCKET_NAME']
   TABLE_NAME = os.environ['TABLE_NAME']

   def lambda_handler(event, context):
       try:
           file_content = event['body']
           file_name = str(uuid.uuid4()) + ".mp4"

           # Upload to S3
           s3.put_object(Bucket=BUCKET_NAME, Key=file_name, Body=file_content)

           # Store metadata in DynamoDB
           table = dynamodb.Table(TABLE_NAME)
           table.put_item(
               Item={
                   'videoId': file_name,
                   'url': f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"
               }
           )

           return {
               'statusCode': 200,
               'body': json.dumps({'message': 'File uploaded successfully!'})
           }
       except Exception as e:
           return {
               'statusCode': 500,
               'body': json.dumps({'error': str(e)})
           }
   ```

3. Add **Environment Variables**:
   - `BUCKET_NAME`: `video-upload-bucket`
   - `TABLE_NAME`: `video-metadata`
4. Attach an execution role with these policies:
   - **AmazonS3FullAccess**
   - **AmazonDynamoDBFullAccess**

### **Step 2: Create the Fetch Handler**
1. Create another function (`video-fetch-handler`).
2. Add the following code:
   ```python
   import boto3
   import json
   import os

   dynamodb = boto3.resource('dynamodb')
   TABLE_NAME = os.environ['TABLE_NAME']

   def lambda_handler(event, context):
       try:
           table = dynamodb.Table(TABLE_NAME)
           response = table.scan()

           return {
               'statusCode': 200,
               'body': json.dumps(response['Items'])
           }
       except Exception as e:
           return {
               'statusCode': 500,
               'body': json.dumps({'error': str(e)})
           }
   ```
3. Add `TABLE_NAME` as an environment variable.
4. Attach the **AmazonDynamoDBFullAccess** policy to this Lambda.

---

## **Phase 4: Setting Up API Gateway**

### **Step 1: Create an API**
1. Navigate to **API Gateway** > **Create API**.
2. Choose **HTTP API** and name your API: `video-app-api`.

### **Step 2: Add Routes**
1. Add a **POST** route (`/upload`):
   - Integration target: `video-upload-handler`.
2. Add a **GET** route (`/fetch`):
   - Integration target: `video-fetch-handler`.

### **Step 3: Deploy the API**
1. Navigate to **Stages**.
2. Create a stage (e.g., `prod`).
3. Copy the **Invoke URL** for frontend integration.

---

## **Phase 5: Setting Up CloudFront for Streaming**

### **Step 1: Create a CloudFront Distribution**
1. Navigate to **CloudFront** > **Create Distribution**.
2. Configure:
   - **Origin Domain Name**: Select `video-upload-bucket`.
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS.
   - **Allowed HTTP Methods**: GET, HEAD.
3. Click **Create Distribution**.

### **Step 2: Secure Access**
1. Use **Signed URLs** for restricted access (optional).

---

## **Phase 6: Testing the Application**

### **Frontend Configuration**
1. Update `app.js` with API Gateway URLs:
   - `uploadUrl`: API Gateway `/upload` URL.
   - `fetchUrl`: API Gateway `/fetch` URL.

### **Test the Workflow**
1. Open the frontend (e.g., hosted on S3).
2. Test uploading a video.
3. Test retrieving and playing videos via CloudFront.

---

## **Phase 7: Monitor and Optimize**

### **CloudWatch**
1. Enable Lambda logging:
   - Navigate to Lambda > Monitor > Logs.
2. Enable API Gateway logging:
   - Navigate to API Gateway > Stages > Enable **Access Logging**.

### **CloudTrail**
1. Enable CloudTrail to track API calls and resource changes.

---

## **IAM Policies**

### **S3 Access Policy**
```json
{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::video-upload-bucket/*"
}
```

### **DynamoDB Access Policy**
```json
{
  "Effect": "Allow",
  "Action": "dynamodb:*",
  "Resource": "arn:aws:dynamodb:us-east-1:*:table/video-metadata"
}
```

---

Save this document as `README.md` in your Git repository. Let me know if you need additional support or further refinements!

