// src/lib/file-utils.ts - Cross-platform file path utilities
import fs from 'fs';
import path from 'path';

/**
 * Normalize path separators for storage (always use forward slashes)
 * This ensures consistent paths across Windows/Unix systems in the database
 */
export function normalizePathForStorage(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Convert storage path to system path for file operations
 * This handles the conversion from stored paths to OS-specific paths
 */
export function convertStoragePathToSystemPath(storagePath: string): string {
  return storagePath.replace(/[\/\\]/g, path.sep);
}

/**
 * Find a file using multiple path resolution strategies
 * This handles cases where paths might have different separators or be relative
 */
export function findFileWithPathStrategies(originalPath: string, baseDir?: string): string | null {
  const strategies = [
    // Strategy 1: Use path as-is
    originalPath,
    
    // Strategy 2: Convert separators for current OS
    convertStoragePathToSystemPath(originalPath),
    
    // Strategy 3: Try as absolute path
    path.isAbsolute(originalPath) ? originalPath : null,
    
    // Strategy 4: Try relative to base directory
    baseDir ? path.join(baseDir, originalPath) : null,
    
    // Strategy 5: Try relative to current working directory
    path.join(process.cwd(), originalPath),
    
    // Strategy 6: Try in uploads directory
    path.join(process.cwd(), 'uploads', path.basename(originalPath)),
  ].filter(Boolean) as string[];

  for (const testPath of strategies) {
    // Try with different path separators
    const pathVariations = [
      testPath,
      testPath.replace(/\\/g, '/'),
      testPath.replace(/\//g, '\\'),
    ];

    for (const variation of pathVariations) {
      if (fs.existsSync(variation)) {
        console.log(`✅ Found file at: ${variation}`);
        return variation;
      }
    }
  }

  return null;
}

/**
 * Search for a file in a directory tree
 * Useful when the exact path is unknown but we know the filename
 */
export function searchFileInDirectory(directory: string, targetFileName: string): string | null {
  if (!fs.existsSync(directory)) {
    return null;
  }

  try {
    const files = fs.readdirSync(directory, { recursive: true });
    
    for (const file of files) {
      const fileName = path.basename(file.toString());
      const fullPath = path.join(directory, file.toString());
      
      // Check if filename matches exactly or contains the target name
      if (fileName === targetFileName || 
          fileName.includes(path.basename(targetFileName)) ||
          file.toString().includes(targetFileName)) {
        
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          console.log(`✅ Found file by search: ${fullPath}`);
          return fullPath;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error searching directory:', error);
  }

  return null;
}

/**
 * Get file info for debugging
 */
export function getFileDebugInfo(filePath: string) {
  return {
    originalPath: filePath,
    normalizedPath: normalizePathForStorage(filePath),
    systemPath: convertStoragePathToSystemPath(filePath),
    isAbsolute: path.isAbsolute(filePath),
    exists: fs.existsSync(filePath),
    dirname: path.dirname(filePath),
    basename: path.basename(filePath),
    extname: path.extname(filePath),
    platform: process.platform,
    cwd: process.cwd()
  };
}

/**
 * Create directory if it doesn't exist
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Get user upload directory path
 */
export function getUserUploadDirectory(userId: string): string {
  const uploadDir = path.join(process.cwd(), 'uploads', userId);
  ensureDirectoryExists(uploadDir);
  return uploadDir;
}