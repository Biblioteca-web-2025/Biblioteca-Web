import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuración del cliente R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Importante para R2
});

const BUCKET_NAME = process.env.R2_BUCKET!;

export class R2Service {  /**
   * Sube un archivo a Cloudflare R2
   */  static async uploadFile(
    file: Buffer | Uint8Array | string,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Validaciones básicas
      if (!file) {
        throw new Error('No file data provided for upload');
      }
      
      if (!BUCKET_NAME) {
        throw new Error('R2_BUCKET environment variable not set');
      }
      
      console.log(`📂 R2: Iniciando subida de archivo a bucket ${BUCKET_NAME}, key: ${key}`);
      console.log(`📊 R2: Tipo de contenido: ${contentType}, tamaño aproximado: ${
        typeof file === 'string' ? file.length : file.byteLength
      } bytes`);
      
      // Preparar comando para subir archivo
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      });

      // Enviar archivo a R2
      console.log('⏳ R2: Enviando archivo a Cloudflare R2...');
      await r2Client.send(command);
      console.log('✅ R2: Archivo subido exitosamente');
      
      // Determinar la URL pública del archivo
      let publicUrl: string;
      
      // Usar dominio personalizado si está configurado
      if (process.env.R2_PUBLIC_DOMAIN) {
        publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;
      }
      // Usar URL pública R2 si está disponible el bucket público
      else if (process.env.R2_PUBLIC_BUCKET) {
        publicUrl = `https://${process.env.R2_PUBLIC_BUCKET}.r2.dev/${key}`;
      }
      // Fallback usando una URL basada en el access key
      else {
        publicUrl = `https://pub-${process.env.R2_ACCESS_KEY_ID?.substring(0, 8) || 'unknown'}.r2.dev/${BUCKET_NAME}/${key}`;
      }
      
      console.log(`🔗 R2: URL pública generada: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('❌ Error al subir archivo a R2:', error);
      // Proporcionar información detallada sobre el error para facilitar diagnóstico
      const errorDetails = error instanceof Error 
        ? `${error.name}: ${error.message}` 
        : 'Error desconocido';
      
      throw new Error(`Error en la subida a R2: ${errorDetails}`);
    }
  }

  /**
   * Elimina un archivo de Cloudflare R2
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await r2Client.send(command);
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      throw new Error('Failed to delete file from R2');
    }
  }

  /**
   * Genera una URL firmada para acceso temporal a un archivo
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
      return signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Genera una clave única para el archivo basada en el timestamp y nombre original
   */
  static generateFileKey(originalName: string, prefix: string = 'documents'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_');
    
    return `${prefix}/${timestamp}_${randomString}_${sanitizedName}`;
  }

  /**
   * Extrae la clave del archivo de una URL completa de R2
   */
  static extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remover el bucket name del path
      pathParts.shift(); // Remove empty string
      pathParts.shift(); // Remove bucket name
      return pathParts.join('/');
    } catch (error) {
      // Si no es una URL válida, asumir que ya es una clave
      return url;
    }
  }

  /**
   * Verifica si un archivo existe en R2
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await r2Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene información de un archivo
   */
  static async getFileInfo(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await r2Client.send(command);
      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error('Failed to get file info');
    }
  }
}

export default R2Service;
