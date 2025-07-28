export interface ChunkedUploadOptions {
  file: File | string; // File object or base64 string
  filename: string;
  userId: string;
  fileId?: string;
  uploadType: 'project' | 'template' | 'thumbnail';
  chunkSize?: number;
  token?: string;
  metadata?: any;
  onProgress?: (progress: number, chunksUploaded: number, totalChunks: number) => void;
}

export interface ChunkedUploadResult {
  success: boolean;
  key: string;
  url: string;
  uploadType: string;
  metadata?: any;
}

/**
 * Upload a file in chunks to the server
 */
export async function uploadFileInChunks(options: ChunkedUploadOptions): Promise<ChunkedUploadResult> {
  const {
    file,
    filename,
    userId,
    fileId,
    uploadType,
    chunkSize = 1024 * 1024, // 1MB default chunk size
    token,
    metadata,
    onProgress
  } = options;

  // Convert file to buffer
  let fileBuffer: ArrayBuffer;
  
  if (typeof file === 'string') {
    // Base64 string
    const binaryString = atob(file);
    fileBuffer = new ArrayBuffer(binaryString.length);
    const uint8Array = new Uint8Array(fileBuffer);
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
  } else {
    // File object
    fileBuffer = await file.arrayBuffer();
  }

  const totalSize = fileBuffer.byteLength;
  const totalChunks = Math.ceil(totalSize / chunkSize);
  const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  console.log(`🚀 Starting chunked upload: ${filename}`);
  console.log(`📦 Total size: ${totalSize} bytes, Chunks: ${totalChunks}, Chunk size: ${chunkSize} bytes`);

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, totalSize);
    const chunkData = fileBuffer.slice(start, end);

    console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks} (${chunkData.byteLength} bytes)`);

    const formData = new FormData();
    formData.append('chunk', new Blob([chunkData]));
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('uploadId', uploadId);
    formData.append('filename', filename);
    formData.append('userId', userId);
    formData.append('uploadType', uploadType);
    
    if (fileId) {
      formData.append('fileId', fileId);
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('/api/upload/chunked', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Chunk upload failed: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    if (onProgress) {
      onProgress(result.progress || (chunkIndex + 1) / totalChunks, chunkIndex + 1, totalChunks);
    }

    // If this was the last chunk, return the final result
    if (result.success && result.url) {
      console.log(`✅ Upload completed successfully: ${result.url}`);
      return {
        success: true,
        key: result.key,
        url: result.url,
        uploadType: result.uploadType,
        metadata: result.metadata
      };
    }
  }

  throw new Error('Upload completed but no final result received');
}

/**
 * Helper function specifically for project file uploads (maintains compatibility with existing code)
 */
export async function uploadProjectFile(
  fileData: string, 
  filename: string, 
  userId: string, 
  fileId: string | undefined,
  token: string,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> {
  return uploadFileInChunks({
    file: fileData,
    filename,
    userId,
    fileId,
    uploadType: 'project',
    token,
    onProgress: onProgress ? (progress, _, __) => onProgress(progress) : undefined
  });
}

/**
 * Helper function specifically for template uploads
 */
export async function uploadTemplateFile(
  file: File,
  name: string,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> {
  return uploadFileInChunks({
    file,
    filename: `${name.replace(/\s+/g, '')}.sb3`,
    userId: 'templates', // Templates don't have a specific user
    uploadType: 'template',
    onProgress: onProgress ? (progress, _, __) => onProgress(progress) : undefined
  });
}

/**
 * Helper function specifically for thumbnail uploads
 */
export async function uploadThumbnailFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<ChunkedUploadResult> {
  return uploadFileInChunks({
    file,
    filename: file.name,
    userId: 'thumbnails', // Thumbnails don't have a specific user
    uploadType: 'thumbnail',
    metadata: { mimeType: file.type },
    onProgress: onProgress ? (progress, _, __) => onProgress(progress) : undefined
  });
} 