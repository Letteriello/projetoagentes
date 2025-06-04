"use client";

import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit3, LogOut } from "lucide-react";

// Keep UserProfile for potential external uses, but AuthContext's User will be primary
export interface UserProfile {
  name: string; // Corresponds to username in AuthContext's User
  email: string;
  avatarUrl?: string;
  initials?: string;
  bio?: string;
}

interface UserProfileCardProps {
  // user prop is no longer needed as it will come from context
  onEditProfile?: () => void;
  // onLogout prop is no longer needed as it will come from context
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  onEditProfile,
  className,
}) => {
  const { user, logout, isLoading } = useAuth();

  const getInitials = (name: string): string => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0) + names[names.length - 1].charAt(0)
    ).toUpperCase();
  };

  if (isLoading) {
    return <Card className={className}><CardContent><p>Loading user...</p></CardContent></Card>;
  }

  if (!user) {
    // Optionally, render a login button or a guest state
    // For now, returning null if no user, or you can redirect / show login
    // Depending on where this card is used, parent might handle this.
    // Or, display a login button:
    // return <Button onClick={() => router.push('/login')}>Login</Button>;
    return <Card className={className}><CardContent><p>Please log in.</p></CardContent></Card>;
  }

  // Use user.username as name
  const displayName = user.username;
  const userInitials = getInitials(displayName);
  // User email from context
  const displayEmail = user.email;

  return (
    <Card className={className}>
      <CardHeader className="items-center text-center">
        <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20">
          {/* Assuming avatarUrl might be part of user object in future, not in current User interface */}
          {/* <AvatarImage src={user.avatarUrl} alt={displayName} /> */}
          <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{displayName}</CardTitle>
        <CardDescription>{displayEmail}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Assuming bio might be part of user object in future, not in current User interface */}
        {/* {user.bio && (
          <p className="text-sm text-muted-foreground text-center mb-6">
            {user.bio}
          </p>
        )} */}
        <div className="space-y-3">
          {onEditProfile && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onEditProfile}
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          )}
          {/* Wire logout to context's logout function */}
          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
