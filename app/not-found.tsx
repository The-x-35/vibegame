import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-muted-foreground mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button asChild>
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
} 