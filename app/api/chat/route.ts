import { NextResponse } from "next/server";
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define available templates with their URLs
const TEMPLATES = [
  {
    name: "Ball Game",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BallGame.sb3",
    description: "A very simple ball game."
  },
  {
    name: "3D Ping Pong",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/3DPingPong.sb3",
    description: "Experience a dynamic 3D ping pong challenge with realistic physics."
  },
  {
    name: "Brick Breaker",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BrickBreaker.sb3",
    description: "Break through walls of bricks with precision and exciting power-ups."
  },
  {
    name: "Endless Runner",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/EndlessRunnerGames.sb3",
    description: "Race through an endless course full of obstacles and non-stop action."
  },
  {
    name: "Flappy Bird",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/FlappyBird.sb3",
    description: "Guide your bird through challenging gaps in this addictive arcade classic."
  },
  {
    name: "Hill Climb Racing",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/HillClimbRacing.sb3",
    description: "Conquer rugged terrains and steep hills in this thrilling driving game."
  },
  {
    name: "Maze Game",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeGame.sb3",
    description: "Navigate intricate mazes and test your puzzle-solving skills."
  },
  {
    name: "Maze Runner Mario",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeRunnerMario.sb3",
    description: "Embark on a maze adventure with a fun twist reminiscent of classic Mario."
  },
  {
    name: "Memory Card Game",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MemoryCardGame.sb3",
    description: "Challenge your memory with an engaging and fast-paced card matching game."
  },
  {
    name: "Space Shooter",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/SpaceShooter.sb3",
    description: "Pilot your spaceship and blast through waves of enemy forces in space."
  },
  {
    name: "Whack-A-Mole",
    url: "https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/whackAMole.sb3",
    description: "Test your reflexes in a fast-paced game where quick hits are key."
  }
];

// Force dynamic runtime so we can use request.json()
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a template matcher. Provide 3-4 game template suggestions that best align with the user's request.
Sort the suggestions by relevance, with the closest match first.
For each suggestion, respond using the exact URL from this list:

${TEMPLATES.map(t => t.url).join('\n')}

Return your output as a JSON object with a "urls" field, e.g.:
{
  "urls": ["url1", "url2", "url3"]
}
`
        },
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.3,
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    const suggestedUrls = Array.isArray(response.urls) ? response.urls : [];

    // Validate that all suggested URLs are in our template list
    const validUrls = suggestedUrls.filter((url: string) => TEMPLATES.some(t => t.url === url));
    
    // If we don't have enough valid URLs, add some random ones
    while (validUrls.length < 3) {
      const randomTemplate = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      if (!validUrls.includes(randomTemplate.url)) {
        validUrls.push(randomTemplate.url);
      }
    }

    // Get template details for each URL
    const suggestions = validUrls.map((url: string) => {
      const template = TEMPLATES.find(t => t.url === url);
      return {
        url: url,
        name: template?.name || "Unknown Game",
        description: template?.description || ""
      };
    });

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    // Rethrow to let Next.js surface the full stack in terminal
    throw error;
  }
}
