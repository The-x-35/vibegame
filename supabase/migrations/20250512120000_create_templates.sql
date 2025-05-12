CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable row level security on templates
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to select templates
CREATE POLICY "Public select templates"
  ON templates
  FOR SELECT
  USING (true);

-- Seed initial template data
INSERT INTO templates (name, url, description) VALUES
  ('Ball Game', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BallGame.sb3', 'A very simple ball game.'),
  ('3D Ping Pong', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/3DPingPong.sb3', 'Experience a dynamic 3D ping pong challenge with realistic physics.'),
  ('Brick Breaker', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/BrickBreaker.sb3', 'Break through walls of bricks with precision and exciting power-ups.'),
  ('Endless Runner', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/EndlessRunnerGames.sb3', 'Race through an endless course full of obstacles and non-stop action.'),
  ('Flappy Bird', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/FlappyBird.sb3', 'Guide your bird through challenging gaps in this addictive arcade classic.'),
  ('Hill Climb Racing', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/HillClimbRacing.sb3', 'Conquer rugged terrains and steep hills in this thrilling driving game.'),
  ('Maze Game', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeGame.sb3', 'Navigate intricate mazes and test your puzzle-solving skills.'),
  ('Maze Runner Mario', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MazeRunnerMario.sb3', 'Embark on a maze adventure with a fun twist reminiscent of classic Mario.'),
  ('Memory Card Game', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/MemoryCardGame.sb3', 'Challenge your memory with an engaging and fast-paced card matching game.'),
  ('Space Shooter', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/SpaceShooter.sb3', 'Pilot your spaceship and blast through waves of enemy forces in space.'),
  ('Whack-A-Mole', 'https://raw.githubusercontent.com/SendArcade/alpha-www/main/public/games/whackAMole.sb3', 'Test your reflexes in a fast-paced game where quick hits are key.'); 