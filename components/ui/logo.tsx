import { Gamepad2 } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`text-primary ${sizeClasses[size]} font-bold flex items-center`}>
        <Gamepad2 className="w-8 h-8 mr-2 text-blue-500" />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
          VibeGame
        </span>
      </div>
    </div>
  );
}