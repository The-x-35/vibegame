import React from 'react';
import { query } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function UsersPage() {
  const result = await query('SELECT wallet, created_at, updated_at FROM users ORDER BY created_at DESC');
  const users = result.rows;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Avatar</th>
              <th className="text-left py-3 px-4">Wallet</th>
              <th className="text-left py-3 px-4">Created At</th>
              <th className="text-left py-3 px-4">Updated At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.wallet} className="border-b hover:bg-muted/50">
                <td className="py-3 px-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${user.wallet}`} 
                      alt={user.wallet} 
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-xs">
                      {user.wallet.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </td>
                <td className="py-3 px-4 font-mono text-sm">{user.wallet}</td>
                <td className="py-3 px-4">{new Date(user.created_at).toLocaleString()}</td>
                <td className="py-3 px-4">{new Date(user.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 