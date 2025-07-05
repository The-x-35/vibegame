const axios = require('axios');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');
const JSZip = require('jszip');
require('dotenv').config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Initialize PostgreSQL client
const db = new Client({
  connectionString: process.env.DATABASE_URL,
});

// Function to clean and truncate text
function cleanText(text, maxLength = 500) {
  if (!text) return '';
  
  // Remove excessive tags and repetitive content
  let cleaned = text
    .replace(/#\w+/g, '') // Remove hashtags
    .replace(/={3,}/g, '') // Remove multiple equals signs
    .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines
    .replace(/(.)\1{10,}/g, '$1') // Remove excessive repetition
    .trim();
  
  // Truncate if too long
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength) + '...';
  }
  
  return cleaned || 'A fun Scratch game to play and remix!';
}

// Function to generate a unique slug for template ID
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Function to get project metadata from TurboWarp API (includes token)
async function getProjectMetadata(projectId) {
  try {
    console.log(`Getting project metadata for ${projectId}...`);
    
    const urls = [
      `https://trampoline.turbowarp.org/api/projects/${projectId}`,
      `https://trampoline.turbowarp.xyz/api/projects/${projectId}`
    ];
    
    let firstError;
    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        if (response.status === 200) {
          console.log(`Successfully got metadata for ${projectId}`);
          return response.data;
        }
        
        if (response.status === 404) {
          throw new Error('Project is probably unshared');
        }
        
        throw new Error(`Unexpected status code: ${response.status}`);
      } catch (err) {
        if (!firstError) {
          firstError = err;
        }
        console.log(`Failed to get metadata from ${url}: ${err.message}`);
        continue;
      }
    }
    
    throw firstError;
  } catch (error) {
    console.error(`Error getting project metadata for ${projectId}:`, error.message);
    throw error;
  }
}

// Function to download .sb3 file from Scratch using metadata
async function downloadSb3FileWithMetadata(projectId, metadata) {
  try {
    console.log(`Downloading .sb3 file for project ${projectId}...`);
    
    const token = metadata.project_token;
    
    if (!token) {
      throw new Error('No project token found in metadata');
    }
    
    console.log(`Using token to download project ${projectId}`);
    
    // Use the authenticated URL with token - this should return the project JSON data
    const url = `https://projects.scratch.mit.edu/${projectId}?token=${token}`;
    
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': `https://scratch.mit.edu/projects/${projectId}/`,
        'Accept': 'application/json, */*'
      }
    });
    
    // Debug: Check what we received
    console.log(`Response status: ${response.status}`);
    console.log(`Response content-type: ${response.headers['content-type']}`);
    console.log(`Response data type: ${typeof response.data}`);
    
    let projectData;
    if (typeof response.data === 'string') {
      try {
        projectData = JSON.parse(response.data);
      } catch (e) {
        // If it's not JSON, treat it as raw data
        projectData = response.data;
      }
    } else {
      projectData = response.data;
    }
    
    // Convert the project data to SB3 format
    // Based on the TurboWarp code, we need to use the storage layer to convert JSON to SB3
    let sb3Buffer;
    
    if (typeof projectData === 'object' && projectData !== null) {
      // If we got JSON project data, we need to convert it to SB3 format
      console.log(`Got JSON project data, converting to SB3 format...`);
      
      // Create a simple SB3 structure
      // SB3 files are ZIP files containing project.json and assets
      const zip = new JSZip();
      
      // Add the project.json file
      zip.file('project.json', JSON.stringify(projectData));
      
      // Generate the ZIP buffer
      sb3Buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log(`Successfully created SB3 file for project ${projectId} (${sb3Buffer.length} bytes)`);
    } else {
      // If we got raw data, convert it to buffer
      sb3Buffer = Buffer.from(projectData);
      console.log(`Got raw data for project ${projectId} (${sb3Buffer.length} bytes)`);
    }
    
    // Validate that we have some data
    if (!sb3Buffer || sb3Buffer.length === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    return sb3Buffer;
    
  } catch (error) {
    console.error(`Error downloading .sb3 file for project ${projectId}:`, error.message);
    throw error;
  }
}

// Function to upload file to S3
async function uploadToS3(buffer, key, contentType = 'application/octet-stream') {
  try {
    console.log(`Uploading ${key} to S3...`);
    
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read',
    }));
    
    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log(`Successfully uploaded ${key} to S3: ${url}`);
    return url;
  } catch (error) {
    console.error(`Error uploading ${key} to S3:`, error.message);
    throw error;
  }
}

// Function to download and upload thumbnail
async function downloadAndUploadThumbnail(imageUrl, projectId) {
  try {
    console.log(`Downloading thumbnail for project ${projectId}...`);
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 15000, // 15 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const buffer = Buffer.from(response.data);
    const key = `templates/thumbnails/${projectId}.png`;
    
    const thumbnailUrl = await uploadToS3(buffer, key, 'image/png');
    return thumbnailUrl;
  } catch (error) {
    console.error(`Error downloading/uploading thumbnail for project ${projectId}:`, error.message);
    // Return default thumbnail if upload fails
    return '/og/og1.png';
  }
}

// Function to insert template into database
async function insertTemplate(id, name, url, description, thumbnail) {
  try {
    console.log(`Inserting template ${name} into database...`);
    
    const result = await db.query(
      'INSERT INTO templates (id, name, url, description, thumbnail) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, url, description, thumbnail]
    );
    
    console.log(`Successfully inserted template ${name} into database`);
    return result.rows[0];
  } catch (error) {
    console.error(`Error inserting template ${name} into database:`, error.message);
    throw error;
  }
}

// Function to check if template already exists
async function templateExists(id) {
  try {
    const result = await db.query('SELECT id FROM templates WHERE id = $1', [id]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking if template exists:', error.message);
    return false;
  }
}

// Function to scrape a single batch of games
async function scrapeBatch(offset, limit = 10) {
  console.log(`\n🔄 Fetching batch: offset=${offset}, limit=${limit}`);
  
  const apiUrl = `https://api.scratch.mit.edu/explore/projects?limit=${limit}&offset=${offset}&language=en&mode=trending&q=games`;
  
  const response = await axios.get(apiUrl, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  
  const games = response.data;
  console.log(`Found ${games.length} games in batch (offset: ${offset})`);
  
  return games;
}

// Function to process a single game
async function processGame(game, batchStats) {
  try {
    const projectId = game.id.toString();
    const title = game.title || `Scratch Game ${projectId}`;
    const description = cleanText(game.description || game.instructions || 'A fun Scratch game to play and remix!');
    const slug = generateSlug(title);
    const templateId = `scratch-${slug}-${projectId}`;
    
    console.log(`\nProcessing: ${title} (ID: ${projectId})`);
    
    // Check if template already exists
    if (await templateExists(templateId)) {
      console.log(`Template ${templateId} already exists, skipping...`);
      batchStats.skipped++;
      return;
    }
    
    // Get project metadata first
    const metadata = await getProjectMetadata(projectId);
    
    // Download .sb3 file using the metadata
    const sb3Buffer = await downloadSb3FileWithMetadata(projectId, metadata);
    
    // Use metadata for better title and description if available
    const finalTitle = metadata.title || title;
    const finalDescription = cleanText(
      metadata.instructions || 
      metadata.description || 
      game.description || 
      game.instructions || 
      'A fun Scratch game to play and remix!'
    );
    
    // Upload .sb3 file to S3
    const sb3Key = `templates/scratch-${projectId}.sb3`;
    const sb3Url = await uploadToS3(sb3Buffer, sb3Key);
    
    // Download and upload thumbnail
    const thumbnailUrl = game.image ? 
      await downloadAndUploadThumbnail(game.image, projectId) : 
      '/og/og1.png';
    
    // Insert into database
    await insertTemplate(templateId, finalTitle, sb3Url, finalDescription, thumbnailUrl);
    
    batchStats.processed++;
    console.log(`✅ Successfully processed: ${finalTitle}`);
    
  } catch (error) {
    console.error(`❌ Error processing game ${game.id}:`, error.message);
    batchStats.errors++;
  }
}

// Main function to scrape and process templates in batches
async function scrapeAndProcessTemplates() {
  try {
    console.log('🚀 Starting Scratch template scraping with batch processing...');
    
    // Connect to database
    await db.connect();
    console.log('Connected to database');
    
    let offset = 2370;
    const limit = 10;
    let totalStats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      batches: 0
    };
    
    let consecutiveEmptyBatches = 0;
    const maxConsecutiveEmptyBatches = 3; // Stop after 3 consecutive empty batches
    
    while (true) {
      try {
        // Fetch games from Scratch API
        const games = await scrapeBatch(offset, limit);
        
        if (games.length === 0) {
          consecutiveEmptyBatches++;
          console.log(`⚠️  Empty batch ${consecutiveEmptyBatches}/${maxConsecutiveEmptyBatches} at offset ${offset}`);
          
          if (consecutiveEmptyBatches >= maxConsecutiveEmptyBatches) {
            console.log(`🛑 Stopping after ${maxConsecutiveEmptyBatches} consecutive empty batches`);
            break;
          }
          
          offset += limit;
          continue;
        }
        
        // Reset consecutive empty batches counter
        consecutiveEmptyBatches = 0;
        totalStats.batches++;
        
        let batchStats = {
          processed: 0,
          skipped: 0,
          errors: 0
        };
        
        // Process each game in the batch
        for (const game of games) {
          await processGame(game, batchStats);
          
          // Add a small delay to be respectful to the API
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Update total stats
        totalStats.processed += batchStats.processed;
        totalStats.skipped += batchStats.skipped;
        totalStats.errors += batchStats.errors;
        
        console.log(`\n📊 Batch ${totalStats.batches} completed (offset: ${offset})`);
        console.log(`   ✅ Processed: ${batchStats.processed}`);
        console.log(`   ⏭️  Skipped: ${batchStats.skipped}`);
        console.log(`   ❌ Errors: ${batchStats.errors}`);
        
        // Move to next batch
        offset += limit;
        
        // Add a longer delay between batches
        console.log(`⏳ Waiting 1 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing batch at offset ${offset}:`, error.message);
        
        // If we get an error, try the next batch
        offset += limit;
        consecutiveEmptyBatches++;
        
        if (consecutiveEmptyBatches >= maxConsecutiveEmptyBatches) {
          console.log(`🛑 Stopping due to consecutive errors`);
          break;
        }
        
        // Wait a bit longer after an error
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log(`\n🎉 All batches completed!`);
    console.log(`📊 Final Statistics:`);
    console.log(`   📦 Batches processed: ${totalStats.batches}`);
    console.log(`   ✅ Total processed: ${totalStats.processed}`);
    console.log(`   ⏭️  Total skipped: ${totalStats.skipped}`);
    console.log(`   ❌ Total errors: ${totalStats.errors}`);
    console.log(`   📈 Success rate: ${totalStats.processed > 0 ? ((totalStats.processed / (totalStats.processed + totalStats.errors)) * 100).toFixed(1) : 0}%`);
    
  } catch (error) {
    console.error('💥 Fatal error in scraping process:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await db.end();
    console.log('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  scrapeAndProcessTemplates()
    .then(() => {
      console.log('🎉 Scraping process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Scraping process failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeAndProcessTemplates }; 