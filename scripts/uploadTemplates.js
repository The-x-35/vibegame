const axios = require('axios');
require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// List of template files and their raw GitHub URLs
const templates = [
  { key: 'templates/BallGame.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BallGame.sb3' },
  { key: 'templates/3DPingPong.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/3DPingPong.sb3' },
  { key: 'templates/BrickBreaker.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BrickBreaker.sb3' },
  { key: 'templates/EndlessRunnerGames.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/EndlessRunnerGames.sb3' },
  { key: 'templates/FlappyBird.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/FlappyBird.sb3' },
  { key: 'templates/HillClimbRacing.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/HillClimbRacing.sb3' },
  { key: 'templates/MazeGame.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeGame.sb3' },
  { key: 'templates/MazeRunnerMario.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeRunnerMario.sb3' },
  { key: 'templates/MemoryCardGame.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MemoryCardGame.sb3' },
  { key: 'templates/SpaceShooter.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/SpaceShooter.sb3' },
  { key: 'templates/whackAMole.sb3', url: 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/whackAMole.sb3' },
];

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function uploadTemplates() {
  for (const { key, url } of templates) {
    console.log(`Downloading ${url}...`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`Uploading to S3 as ${key}...`);
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: response.data,
      ContentType: 'application/octet-stream',
      ACL: 'public-read',
    }));
    console.log(`Successfully uploaded ${key}`);
  }
}

uploadTemplates().catch(err => {
  console.error('Error uploading templates:', err);
  process.exit(1);
}); 