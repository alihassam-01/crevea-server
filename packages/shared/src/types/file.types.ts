/**
 * File Type
 */
export enum FileType {
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  DIGITAL_PRODUCT = 'DIGITAL_PRODUCT',
}

/**
 * Image Variant
 */
export enum ImageVariant {
  THUMBNAIL = 'THUMBNAIL',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ORIGINAL = 'ORIGINAL',
}

/**
 * File interface
 */
export interface IFile {
  id: string;
  userId: string;
  type: FileType;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  variants?: IFileVariant[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * File Variant (for images)
 */
export interface IFileVariant {
  variant: ImageVariant;
  url: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Upload Response
 */
export interface IUploadResponse {
  fileId: string;
  url: string;
  variants?: IFileVariant[];
}
