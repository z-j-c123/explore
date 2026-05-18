import { Injectable } from '@nestjs/common';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  async saveImage(
    buffer: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<string> {
    const ext = this.extensionFromMime(mimeType, originalName);
    const filename = `shops/${randomUUID()}${ext}`;

    if (this.useBlob) {
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: mimeType,
      });
      return blob.url;
    }

    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const localName = `${randomUUID()}${ext}`;
    await writeFile(join(uploadsDir, localName), buffer);
    return `/uploads/${localName}`;
  }

  private extensionFromMime(mime: string, name?: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };
    if (map[mime]) return map[mime];
    const fromName = name?.match(/\.[a-zA-Z0-9]+$/)?.[0];
    return fromName ?? '.jpg';
  }
}
