"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/lib/hooks/use-user";
import { useWallet } from '@solana/wallet-adapter-react';
import { LogOut, User, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UserButton() {
  const { user } = useUser();
  const { disconnect } = useWallet();
  const router = useRouter();

  if (!user) return null;

  // Get initials from wallet address
  const getInitials = () => {
    if (!user.wallet) return "U";
    return user.wallet.substring(0, 2).toUpperCase();
  };

  // Generate DiceBear avatar URL using wallet address as seed
  const getAvatarUrl = () => {
    if (!user.wallet) return "";
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.wallet}`;
  };

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Avatar>
            <AvatarImage src={getAvatarUrl()} alt={user.wallet} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={handleDisconnect}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect Wallet</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}