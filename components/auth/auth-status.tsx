'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useAuthContext } from '@/components/providers/auth-provider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, Database } from 'lucide-react';

interface AuthStatusProps {
  isMobile?: boolean;
}

export default function AuthStatus({ isMobile = false }: AuthStatusProps) {
  const { user, signOut, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
        <div className="h-5 w-24 animate-pulse rounded bg-muted"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'gap-2'}`}>
        <Link href="/login" className={isMobile ? 'flex-1 mr-2' : ''}>
          <Button 
            variant="ghost" 
            size={isMobile ? "default" : "sm"}
            className={`text-muted-foreground hover:text-foreground border border-transparent hover:border-border ${isMobile ? 'w-full' : ''}`}
          >
            Sign In
          </Button>
        </Link>
        <Link href="/signup" className={isMobile ? 'flex-1' : ''}>
          <Button 
            size={isMobile ? "default" : "sm"}
            className={`bg-primary hover:bg-primary/90 text-primary-foreground ${isMobile ? 'w-full' : ''}`}
          >
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  const userInitial = user?.displayName?.[0] || user?.email?.[0] || '?';

  if (isMobile) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
              <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 mt-4">
          <Link href="/profile">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
          </Link>
          {user?.isAdmin && (
            <Link href="/admin">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Database className="mr-2 h-4 w-4" />
                Admin Dashboard
              </Button>
            </Link>
          )}
          <Button 
            variant="destructive" 
            size="sm" 
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
                <AvatarFallback>{userInitial.toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <p className="text-xs leading-none text-muted-foreground mt-1">
                  Auth: Supabase
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            {user?.isAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Database className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 