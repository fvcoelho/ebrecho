import { put, del, list } from '@vercel/blob';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { randomUUID } from 'crypto';

export interface BlobImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ProcessedBlobImage {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export class BlobImageService {
  private readonly thumbnailWidth = 200;
  private readonly thumbnailHeight = 200;
  private readonly processedWidth = 800;
  private readonly processedHeight = 800;

  /**
   * Process an image from Blob URL and generate thumbnail and processed versions
   */
  async processImageFromUrl(
    imageUrl: string,
    filename: string,
    options: BlobImageOptions = {}
  ): Promise<ProcessedBlobImage> {
    try {
      logger.info('Processing image from Blob URL', { imageUrl, filename });

      // Fetch the image from Blob URL
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);

      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();

      // Generate processed version
      const processedBuffer = await this.createProcessedImage(imageBuffer, options);
      
      // Generate thumbnail
      const thumbnailBuffer = await this.createThumbnail(imageBuffer);

      // Upload processed version to Blob
      const processedName = `processed/${filename.replace(/\.[^/.]+$/, '')}-processed.${options.format || 'jpeg'}`;
      const processedBlob = await put(processedName, processedBuffer, {
        access: 'public',
        contentType: `image/${options.format || 'jpeg'}`
      });

      // Upload thumbnail to Blob
      const thumbnailName = `thumbnails/${filename.replace(/\.[^/.]+$/, '')}-thumb.jpeg`;
      const thumbnailBlob = await put(thumbnailName, thumbnailBuffer, {
        access: 'public',
        contentType: 'image/jpeg'
      });

      logger.info('Image processing completed', {
        original: imageUrl,
        processed: processedBlob.url,
        thumbnail: thumbnailBlob.url
      });

      return {
        originalUrl: imageUrl,
        processedUrl: processedBlob.url,
        thumbnailUrl: thumbnailBlob.url,
        metadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          size: imageBuffer.length
        }
      };
    } catch (error) {
      logger.error('Error processing image from Blob:', error);
      throw error;
    }
  }

  /**
   * Create a processed version of the image
   */
  private async createProcessedImage(
    buffer: Buffer,
    options: BlobImageOptions
  ): Promise<Buffer> {
    const width = options.width || this.processedWidth;
    const height = options.height || this.processedHeight;
    const quality = options.quality || 85;
    const format = options.format || 'jpeg';

    let sharpInstance = sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });

    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({ quality });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ quality });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
    }

    return sharpInstance.toBuffer();
  }

  /**
   * Create a thumbnail version of the image
   */
  private async createThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(this.thumbnailWidth, this.thumbnailHeight, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Upload a buffer directly to Blob
   */
  async uploadBuffer(
    buffer: Buffer,
    pathname: string,
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    try {
      const blob = await put(pathname, buffer, {
        access: 'public',
        contentType
      });

      logger.info('Buffer uploaded to Blob', {
        url: blob.url,
        pathname: blob.pathname,
        size: buffer.length
      });

      return blob.url;
    } catch (error) {
      logger.error('Error uploading buffer to Blob:', error);
      throw error;
    }
  }

  /**
   * Delete an image from Blob storage
   */
  async deleteImage(pathname: string): Promise<void> {
    try {
      await del(pathname);
      logger.info('Image deleted from Blob', { pathname });
    } catch (error) {
      logger.error('Error deleting image from Blob:', error);
      throw error;
    }
  }

  /**
   * Delete multiple images from Blob storage
   */
  async deleteImages(pathnames: string[]): Promise<void> {
    try {
      await del(pathnames);
      logger.info('Multiple images deleted from Blob', { count: pathnames.length });
    } catch (error) {
      logger.error('Error deleting images from Blob:', error);
      throw error;
    }
  }

  /**
   * List images in a specific folder
   */
  async listImages(prefix: string): Promise<string[]> {
    try {
      const { blobs } = await list({ prefix });
      return blobs.map(blob => blob.url);
    } catch (error) {
      logger.error('Error listing images from Blob:', error);
      throw error;
    }
  }

  /**
   * Generate a unique filename for uploads
   */
  generateUniqueFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const uuid = randomUUID().substring(0, 8);
    const extension = originalName.split('.').pop() || 'jpg';
    const cleanName = originalName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50);
    
    const parts = [prefix, cleanName, timestamp, uuid].filter(Boolean);
    return `${parts.join('_')}.${extension}`;
  }

  /**
   * Crop an image and upload to Blob
   */
  async cropAndUpload(
    imageUrl: string,
    cropData: { x: number; y: number; width: number; height: number },
    filename: string
  ): Promise<string> {
    try {
      logger.info('Cropping image from Blob URL', { imageUrl, cropData });

      // Fetch the image
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(buffer);

      // Crop the image
      const croppedBuffer = await sharp(imageBuffer)
        .extract({
          left: Math.round(cropData.x),
          top: Math.round(cropData.y),
          width: Math.round(cropData.width),
          height: Math.round(cropData.height)
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Upload cropped image
      const croppedName = `cropped/${filename.replace(/\.[^/.]+$/, '')}-cropped.jpeg`;
      const croppedBlob = await put(croppedName, croppedBuffer, {
        access: 'public',
        contentType: 'image/jpeg'
      });

      logger.info('Image cropped and uploaded', {
        original: imageUrl,
        cropped: croppedBlob.url
      });

      return croppedBlob.url;
    } catch (error) {
      logger.error('Error cropping image:', error);
      throw error;
    }
  }
}

export const blobImageService = new BlobImageService();