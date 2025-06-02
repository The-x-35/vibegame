import { query } from '@/lib/db';

export async function generateUniqueSlug(name: string): Promise<string> {
  // Convert to lowercase and replace spaces with hyphens
  let baseSlug = name.toLowerCase().replace(/\s+/g, '-');
  
  // Remove any characters that aren't alphanumeric or hyphens
  baseSlug = baseSlug.replace(/[^a-z0-9-]/g, '');
  
  // Remove consecutive hyphens
  baseSlug = baseSlug.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  baseSlug = baseSlug.replace(/^-+|-+$/g, '');
  
  // Check if this slug already exists
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const result = await query(
      'SELECT id FROM projects WHERE id = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      break;
    }
    
    // If slug exists, append a number and try again
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
} 