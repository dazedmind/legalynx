// src/lib/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface S3UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  contentType: string;
}

export interface S3DownloadResult {
  buffer: Buffer;
  contentType: string;
  contentLength: number;
  lastModified: Date;
}

export class S3Service {
  private static generateKey(userId: string, filename: string, prefix: string = 'documents'): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${prefix}/${userId}/${timestamp}_${sanitizedFilename}`;
  }

  // Upload file to S3
  static async uploadFile(
    file: Buffer | Uint8Array,
    filename: string,
    contentType: string,
    userId: string,
    folder: string = 'documents'
  ): Promise<S3UploadResult> {
    try {
      const key = this.generateKey(userId, filename, folder);
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: {
          userId,
          originalFilename: filename,
          uploadedAt: new Date().toISOString(),
        },
        // Optional: Server-side encryption
        ServerSideEncryption: 'AES256',
      });

      await s3Client.send(command);

      const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      return {
        key,
        url,
        bucket: BUCKET_NAME,
        size: file.length,
        contentType,
      };
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  // Download file from S3
  static async downloadFile(key: string): Promise<S3DownloadResult> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file content returned from S3');
      }

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      const stream = response.Body as any;
      
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      
      const buffer = Buffer.concat(chunks);

      return {
        buffer,
        contentType: response.ContentType || 'application/octet-stream',
        contentLength: response.ContentLength || buffer.length,
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      console.error('S3 download error:', error);
      throw new Error('Failed to download file from S3');
    }
  }

  // Get signed URL for temporary access
  static async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('S3 signed URL error:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      console.log(`File deleted from S3: ${key}`);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  // Check if file exists
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  // Get file metadata
  static async getFileMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
        etag: response.ETag,
      };
    } catch (error) {
      console.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }
}

// ✅ Export both as named export AND default export for compatibility
export default S3Service;