"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit3, LogOut } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  initials?: string; // Calculated from name if avatarUrl is not present
  bio?: string;
  // Add other fields as needed, e.g., role, joinDate
}

interface UserProfileCardProps {
  user: UserProfile;
  onEditProfile?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onEditProfile,
  onLogout,
  className,
}) => {
  const getInitials = (name: string): string => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const userInitials = user.initials || getInitials(user.name);

  return (
    <Card className={className}>
      <CardHeader className="items-center text-center">
        <Avatar className="w-24 h-24 mb-4 border-2 border-primary/20">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          ) : null}
          <AvatarFallback className="text-3xl">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl">{user.name}</CardTitle>
        <CardDescription>{user.email}</CardDescription>
      </CardHeader>
      <CardContent>
        {user.bio && (
          <p className="text-sm text-muted-foreground text-center mb-6">
            {user.bio}
          </p>
        )}
        <div className="space-y-3">
          {onEditProfile && (
            <Button variant="outline" className="w-full" onClick={onEditProfile}>
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          )}
          {onLogout && (
            <Button variant="destructive" className="w-full" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
