const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function listS3Files() {
  try {
    console.log('🔍 Listing all files from S3 bucket:', process.env.S3_BUCKET_NAME);
    console.log('📅 Ordered by creation date (newest first)\n');

    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: "", // List all files
    });

    const response = await s3.send(command);
    
    if (!response.Contents || response.Contents.length === 0) {
      console.log('❌ No files found in the bucket');
      return;
    }

    // Sort files by LastModified date (newest first)
    const sortedFiles = response.Contents.sort((a, b) => {
      return new Date(b.LastModified) - new Date(a.LastModified);
    });

    console.log(`📊 Found ${sortedFiles.length} files:\n`);

    // Group files by user folder
    const userFiles = {};
    const templateFiles = [];
    const otherFiles = [];

    sortedFiles.forEach((file) => {
      const key = file.Key;
      const lastModified = file.LastModified;
      const size = file.Size;
      const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      const fileInfo = {
        key,
        url,
        lastModified,
        size,
        sizeFormatted: formatBytes(size)
      };

      // Categorize files
      if (key.startsWith('templates/')) {
        templateFiles.push(fileInfo);
      } else if (key.includes('/')) {
        // User files (have folder structure like "wallet/filename.sb3")
        const userFolder = key.split('/')[0];
        if (!userFiles[userFolder]) {
          userFiles[userFolder] = [];
        }
        userFiles[userFolder].push(fileInfo);
      } else {
        otherFiles.push(fileInfo);
      }
    });

    // Display user files
    console.log('👥 USER PROJECTS:');
    console.log('==================');
    Object.keys(userFiles).forEach(userFolder => {
      console.log(`\n📁 User: ${userFolder}`);
      console.log(`   Files: ${userFiles[userFolder].length}`);
      userFiles[userFolder].forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.key}`);
        console.log(`      📅 Created: ${file.lastModified.toISOString()}`);
        console.log(`      📏 Size: ${file.sizeFormatted}`);
        console.log(`      🔗 URL: ${file.url}`);
        console.log('');
      });
    });

    // Display template files
    if (templateFiles.length > 0) {
      console.log('\n🎮 TEMPLATES:');
      console.log('=============');
      templateFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.key}`);
        console.log(`   📅 Created: ${file.lastModified.toISOString()}`);
        console.log(`   📏 Size: ${file.sizeFormatted}`);
        console.log(`   🔗 URL: ${file.url}`);
        console.log('');
      });
    }

    // Display other files
    if (otherFiles.length > 0) {
      console.log('\n📁 OTHER FILES:');
      console.log('===============');
      otherFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.key}`);
        console.log(`   📅 Created: ${file.lastModified.toISOString()}`);
        console.log(`   📏 Size: ${file.sizeFormatted}`);
        console.log(`   🔗 URL: ${file.url}`);
        console.log('');
      });
    }

    // Summary
    console.log('\n📈 SUMMARY:');
    console.log('===========');
    console.log(`Total files: ${sortedFiles.length}`);
    console.log(`User folders: ${Object.keys(userFiles).length}`);
    console.log(`Template files: ${templateFiles.length}`);
    console.log(`Other files: ${otherFiles.length}`);

    // Show the most recent files
    console.log('\n🆕 MOST RECENT FILES:');
    console.log('=====================');
    sortedFiles.slice(0, 10).forEach((file, index) => {
      console.log(`${index + 1}. ${file.Key}`);
      console.log(`   📅 Created: ${file.LastModified.toISOString()}`);
      console.log(`   📏 Size: ${formatBytes(file.Size)}`);
      console.log(`   🔗 URL: https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing S3 files:', error);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run the script
listS3Files(); 