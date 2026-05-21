import { S3Client } from '@aws-sdk/client-s3';
import { getActiveDatabaseConfig } from '@/interface/context/DatabaseSettingsContext';

/**
 * Cria e retorna um S3Client configurado para o Supabase Storage.
 * Lê credenciais do localStorage (configuração dinâmica) com fallback para .env.
 */
export function createS3Client(): S3Client {
  const cfg = getActiveDatabaseConfig();
  return new S3Client({
    forcePathStyle: true,
    region: cfg.s3Region || import.meta.env.VITE_SUPABASE_S3_REGION || 'sa-east-1',
    endpoint:
      cfg.s3Endpoint ||
      import.meta.env.VITE_SUPABASE_S3_ENDPOINT ||
      '',
    credentials: {
      accessKeyId: cfg.s3AccessKeyId || import.meta.env.VITE_SUPABASE_S3_ACCESS_KEY_ID || '',
      secretAccessKey: cfg.s3SecretAccessKey || import.meta.env.VITE_SUPABASE_S3_SECRET_ACCESS_KEY || '',
    },
  });
}

/**
 * Retorna a URL base pública do bucket de imagens do Supabase.
 */
export function getPublicImageBaseUrl(): string {
  const cfg = getActiveDatabaseConfig();
  const endpoint =
    cfg.s3Endpoint ||
    import.meta.env.VITE_SUPABASE_S3_ENDPOINT ||
    '';
  if (!endpoint) return '';
  try {
    const projectRef = new URL(endpoint).hostname.split('.')[0];
    return `https://${projectRef}.supabase.co/storage/v1/object/public/images`;
  } catch (e) {
    console.error('Erro ao processar URL base de imagens:', e);
    return '';
  }
}

export const IMAGE_BUCKET = 'images';
