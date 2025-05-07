// This file will define our database schema once we connect to a real database
// For now, it serves as a reference for the data structure we'll use

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  isPublic: boolean;
  thumbnail: string | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  url: string;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
}