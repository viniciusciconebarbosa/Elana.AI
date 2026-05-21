import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, IMAGE_BUCKET, getPublicImageBaseUrl } from '@/core/infrastructure/storage/S3Client';
import { appDataDir, join } from '@tauri-apps/api/path';
import { writeFile, mkdir } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getActiveDbProvider } from '@/core/infrastructure/repositories/ChatRepositoryFactory';

// FAZ UPLOAD DE UMA IMAGEM BASE64 PARA O DISCO LOCAL (TAURI FS) E RETORNA A URL (asset://)
export async function uploadImageToLocalFs(base64Image: string): Promise<string | null> {
    try {
        const matches = base64Image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const extension = matches[1];
        const binaryString = atob(matches[2]);
        const buffer = new Uint8Array(binaryString.length);
        // buffer representa os bytes da imagem, garante que a imagem seja salva corretamente
        for (let i = 0; i < binaryString.length; i++) {
            buffer[i] = binaryString.charCodeAt(i);
        }
        
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        
        const appData = await appDataDir();
        const imagesDir = await join(appData, 'chat-images');
        
        // Garante que o diretório existe
        try {
            await mkdir(imagesDir, { recursive: true });
        } catch (e) {
            // ignora se já existir
        }
        
        const filePath = await join(imagesDir, fileName);
        await writeFile(filePath, buffer);
        
        // Converte o caminho físico para o protocolo asset:// legível pelo WebView
        return convertFileSrc(filePath);
    } catch (error) {
        console.error('Erro ao salvar imagem localmente:', error);
        return null;
    }
}

// FAZ UPLOAD DE UMA IMAGEM BASE64 PARA O S3 E RETORNA A URL PÚBLICA
export async function uploadImageToS3(base64Image: string): Promise<string | null> {
    try {
        const matches = base64Image.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) return null;

        const extension = matches[1];
        const binaryString = atob(matches[2]);
        const buffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            buffer[i] = binaryString.charCodeAt(i);
        }
        const fileName = `chat-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;

        // S3 client criado apenas quando necessário (evita conexão desnecessária no carregamento do módulo)
        const s3Client = createS3Client();
        await s3Client.send(
            new PutObjectCommand({
                Bucket: IMAGE_BUCKET,
                Key: fileName,
                Body: buffer,
                ContentType: `image/${extension}`,
            })
        );

        return `${getPublicImageBaseUrl()}/${fileName}`;
    } catch (error) {
        console.error('Erro ao fazer upload da imagem para o S3:', error);
        return null;
    }
}

// PROCESSA AS IMAGENS DE TODAS AS MENSAGENS: FAZ UPLOAD DAS BASE64 E RETORNA AS URLS
export async function processMessageImages(messages: any[]) {
    let imagesToDb: string[] = [];
    let textContent = '';

    const processedMessages = await Promise.all(
        messages.map(async (m: any, index: number) => {
            const isLast = index === messages.length - 1;

            if (Array.isArray(m.content)) {
                const newContent = await Promise.all(
                    m.content.map(async (part: any) => {
                        if (part.type === 'text') {
                            if (isLast) textContent = part.text;
                            return part;
                        }
                        if (part.type === 'image') {
                            const imgData = part.image as string;

                            // Imagem nova em base64 — faz upload/salva
                            if (imgData.startsWith('data:image/')) {
                                if (isLast) {
                                    const provider = getActiveDbProvider();

                                    if (provider === 'sqlite') {
                                        // Salva localmente para o banco, mas mantém o base64
                                        // para enviar à IA (asset:// não é acessível remotamente)
                                        const savedUrl = await uploadImageToLocalFs(imgData);
                                        if (savedUrl) imagesToDb.push(savedUrl);
                                        // Envia o base64 original para a IA conseguir analisar
                                        return part;
                                    } else {
                                        // No modo Supabase, faz upload para o S3 e usa a URL pública
                                        const uploadedUrl = await uploadImageToS3(imgData);
                                        if (uploadedUrl) {
                                            imagesToDb.push(uploadedUrl);
                                            return { ...part, image: uploadedUrl };
                                        }
                                    }
                                }
                                // Imagem de mensagem antiga no contexto — mantém base64 (não repete upload)
                                return part;
                            }

                            // URL pública S3 — converte para URL object para o SDK da IA
                            if (imgData.startsWith('https://')) {
                                try { return { ...part, image: new URL(imgData) }; } catch { return part; }
                            }

                            // URL local asset:// — não pode ser acessada pela IA remota, remove do contexto
                            if (imgData.startsWith('asset://')) {
                                return null;
                            }
                        }
                        return part;
                    })
                );
                // Filtra partes nulas (imagens asset:// removidas)
                return { ...m, content: newContent.filter(Boolean) };
            } else {
                if (isLast) textContent = m.content;
                return m;
            }
        })
    );

    return { processedMessages, imagesToDb, textContent };
}
