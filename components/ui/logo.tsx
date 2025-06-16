import Image from "next/image";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "w-48",
    md: "w-72",
    lg: "w-96"
  };

  return (
    <div className="flex items-center">
      <Image
        src="/vibegame-logo.svg"
        alt="VibeGame Logo"
        width={201}
        height={42}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );
}