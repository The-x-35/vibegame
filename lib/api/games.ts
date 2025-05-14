// This file will contain functions to interact with the games in the database
// For now, it provides the game template data

export interface GameTemplate {
  id: string;
  name: string;
  url: string;
  description: string;
  thumbnail?: string;
}

// Build S3 base URL for templates
const S3_BUCKET = process.env.S3_BUCKET_NAME!;
const AWS_REGION = process.env.AWS_REGION!;
const S3_BASE_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/templates`;

export const getGameTemplates = async (): Promise<GameTemplate[]> => {
  // In a real app, this would fetch from the database
  return [
    {
      id: "1",
      name: "Ball Game",
      url: `${S3_BASE_URL}/BallGame.sb3`,
      description: "A very simple ball game."
    },
    {
      id: "2",
      name: "3D Ping Pong",
      url: `${S3_BASE_URL}/3DPingPong.sb3`,
      description: "Experience a dynamic 3D ping pong challenge with realistic physics."
    },
    {
      id: "3",
      name: "Brick Breaker",
      url: `${S3_BASE_URL}/BrickBreaker.sb3`,
      description: "Break through walls of bricks with precision and exciting power-ups."
    },
    {
      id: "4",
      name: "Endless Runner",
      url: `${S3_BASE_URL}/EndlessRunnerGames.sb3`,
      description: "Race through an endless course full of obstacles and non-stop action."
    },
    {
      id: "5",
      name: "Flappy Bird",
      url: `${S3_BASE_URL}/FlappyBird.sb3`,
      description: "Guide your bird through challenging gaps in this addictive arcade classic."
    },
    {
      id: "6",
      name: "Hill Climb Racing",
      url: `${S3_BASE_URL}/HillClimbRacing.sb3`,
      description: "Conquer rugged terrains and steep hills in this thrilling driving game."
    },
    {
      id: "7",
      name: "Maze Game",
      url: `${S3_BASE_URL}/MazeGame.sb3`,
      description: "Navigate intricate mazes and test your puzzle-solving skills."
    },
    {
      id: "8",
      name: "Maze Runner Mario",
      url: `${S3_BASE_URL}/MazeRunnerMario.sb3`,
      description: "Embark on a maze adventure with a fun twist reminiscent of classic Mario."
    },
    {
      id: "9",
      name: "Memory Card Game",
      url: `${S3_BASE_URL}/MemoryCardGame.sb3`,
      description: "Challenge your memory with an engaging and fast-paced card matching game."
    },
    {
      id: "10",
      name: "Space Shooter",
      url: `${S3_BASE_URL}/SpaceShooter.sb3`,
      description: "Pilot your spaceship and blast through waves of enemy forces in space."
    },
    {
      id: "11",
      name: "Whack-A-Mole",
      url: `${S3_BASE_URL}/whackAMole.sb3`,
      description: "Test your reflexes in a fast-paced game where quick hits are key."
    }
  ];
};

export const getGameTemplateById = async (id: string): Promise<GameTemplate | null> => {
  const templates = await getGameTemplates();
  return templates.find(template => template.id === id) || null;
};