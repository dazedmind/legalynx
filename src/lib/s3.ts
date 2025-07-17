// src/lib/s3.ts - S3 utility functions
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export class S3Service {
  
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    key: string, 
    fileBuffer: Buffer, 
    contentType: string = 'application/pdf'
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        ServerSideEncryption: 'AES256', // Encrypt at rest
      });

      await s3Client.send(command);
      
      // Return the S3 URL
      return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new Error(`Failed to upload file to S3: ${error}`);
    }
  }

  /**
   * Get a file from S3 as a buffer
   */
  static async getFileBuffer(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('Empty response from S3');
      }

      // Convert stream to buffer
      const chunks = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('S3 Get File Error:', error);
      
      if (error.name === 'NoSuchKey') {
        throw new Error('File not found in S3');
      }
      if (error.name === 'AccessDenied') {
        throw new Error('Access denied to S3 file');
      }
      
      throw new Error(`Failed to get file from S3: ${error.message}`);
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  static async getPresignedDownloadUrl(
    key: string, 
    filename?: string, 
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ...(filename && {
          ResponseContentDisposition: `attachment; filename="${filename}"`
        })
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 Presigned URL Error:', error);
      throw new Error(`Failed to generate presigned URL: ${error}`);
    }
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  static async getPresignedUploadUrl(
    key: string, 
    contentType: string = 'application/pdf',
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      });

      return await getSignedUrl(s3Client, command, { expiresIn });
    } catch (error) {
      console.error('S3 Upload Presigned URL Error:', error);
      throw new Error(`Failed to generate upload URL: ${error}`);
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('S3 Delete Error:', error);
      throw new Error(`Failed to delete file from S3: ${error}`);
    }
  }

  /**
   * Check if a file exists in S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      // For other errors, we'll assume it doesn't exist
      console.error('S3 File Exists Check Error:', error);
      return false;
    }
  }

  /**
   * Generate a unique S3 key for a file
   */
  static generateFileKey(userId: string, originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `documents/${userId}/${timestamp}_${randomString}_${sanitizedFilename}`;
  }
}

// Export the S3 client for direct use if needed
export { s3Client, BUCKET_NAME };