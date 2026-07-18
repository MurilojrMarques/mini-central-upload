import { randomUUID } from 'node:crypto';

export interface VideoInput {
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

export interface VideoRecord {
  mediaId: string;
  name: string;
  sizeBytes: number;
  status: 'RECEIVED';
}

export class InvalidVideoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidVideoError';
    Object.setPrototypeOf(this, InvalidVideoError.prototype);
  }
}

export class UploadVideoUseCase {
  private readonly ALLOWED_MIME_TYPE = 'video/mp4';
  private readonly MAX_SIZE_MB = 50;
  private readonly MAX_SIZE_BYTES = this.MAX_SIZE_MB * 1024 * 1024;

  public async execute(file?: VideoInput): Promise<VideoRecord> {
    if (!file) {
      throw new InvalidVideoError('Nenhum arquivo de vídeo enviado.');
    }

    if (file.mimeType !== this.ALLOWED_MIME_TYPE) {
      throw new InvalidVideoError('Apenas arquivos de vídeo no formato .mp4 são aceitos.');
    }

    if (file.sizeBytes > this.MAX_SIZE_BYTES) {
      throw new InvalidVideoError(`O arquivo excede o limite máximo permitido de ${this.MAX_SIZE_MB}MB.`);
    }

    return {
      mediaId: `media_${randomUUID()}`,
      name: file.originalName,
      sizeBytes: file.sizeBytes,
      status: 'RECEIVED',
    };
  }
}