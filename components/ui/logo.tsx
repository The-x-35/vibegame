import Image from "next/image";

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg";
}

export function Logo({ size = "md" }: LogoProps) {
  const sizeClasses = {
    xs: "w-20",    // 80px - smaller
    sm: "w-32",    // 128px - smaller
    md: "w-48",    // 192px - smaller (was 288px)
    lg: "w-64"     // 256px - smaller (was 384px)
  };

  return (
    <div className="flex items-center">
      <Image
        src="/logo.svg"
        alt="VibeGame Logo"
        width={201}
        height={42}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );
}