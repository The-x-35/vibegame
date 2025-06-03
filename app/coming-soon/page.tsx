import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        We&apos;re working hard to bring you something amazing. In the meantime, check out our games!
      </p>
      <Button asChild>
        <Link href="/games">View Games</Link>
      </Button>
    </div>
  );
} 