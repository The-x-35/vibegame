import React from 'react';
import { query } from '@/lib/db';

export default async function UsersPage() {
  // Fetch all users
  const result = await query(
    `SELECT wallet, email, name, profile_image, created_at
     FROM users
     ORDER BY created_at DESC;`
  );
  const users = result.rows;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">All Users</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse bg-black text-white">
          <thead className="bg-black">
            <tr>
              <th className="px-4 py-2 border border-white">Wallet</th>
              <th className="px-4 py-2 border border-white">Email</th>
              <th className="px-4 py-2 border border-white">Name</th>
              <th className="px-4 py-2 border border-white">Profile Image URL</th>
              <th className="px-4 py-2 border border-white">Created At</th>
            </tr>
          </thead>
          <tbody className="bg-black">
            {users.map((user: any) => (
              <tr key={user.wallet}>
                <td className="px-4 py-2 border border-white font-mono break-all">{user.wallet}</td>
                <td className="px-4 py-2 border border-white">{user.email || '-'}</td>
                <td className="px-4 py-2 border border-white">{user.name || '-'}</td>
                <td className="px-4 py-2 border border-white break-all">{user.profile_image || '-'}</td>
                <td className="px-4 py-2 border border-white">{new Date(user.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 