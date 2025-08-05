"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, Info } from "lucide-react";

export interface SortOption {
  value: string;
  label: string;
  description: string;
}

export interface GamesSortProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  isLoading?: boolean;
}

const sortOptions: SortOption[] = [
  { 
    value: 'created_at', 
    label: 'Date Created', 
    description: 'Sort by when the game was created'
  },
  { 
    value: 'views_count', 
    label: 'Views', 
    description: 'Sort by number of times the game has been viewed'
  },
  { 
    value: 'likes_count', 
    label: 'Likes', 
    description: 'Sort by number of likes the game has received'
  },
  { 
    value: 'name', 
    label: 'Name', 
    description: 'Sort alphabetically by game name'
  },
  { 
    value: 'price', 
    label: 'Price', 
    description: 'Sort by the current price of the associated token'
  },
  { 
    value: 'market_cap', 
    label: 'Market Cap', 
    description: 'Sort by the market capitalization of the associated token'
  },
];

export default function GamesSort({ sortBy, sortOrder, onSortChange, isLoading = false }: GamesSortProps) {
  const handleSortFieldChange = (value: string) => {
    onSortChange(value, sortOrder);
  };

  const handleSortOrderChange = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(sortBy, newOrder);
  };

  const currentSortOption = sortOptions.find(option => option.value === sortBy);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortFieldChange} disabled={isLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                {currentSortOption?.description || 'Select a sort option to see its description'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSortOrderChange}
          disabled={isLoading}
          className="flex items-center gap-1"
        >
          {sortOrder === 'asc' ? (
            <>
              <ArrowUp className="h-4 w-4" />
              Ascending
            </>
          ) : (
            <>
              <ArrowDown className="h-4 w-4" />
              Descending
            </>
          )}
        </Button>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Loading...
          </div>
        )}

        {/* Current sort info */}
        {currentSortOption && !isLoading && (
          <div className="text-xs text-muted-foreground ml-2">
            Currently sorted by {currentSortOption.label.toLowerCase()} ({sortOrder === 'asc' ? 'low to high' : 'high to low'})
          </div>
        )}
      </div>
    </TooltipProvider>
  );
} 