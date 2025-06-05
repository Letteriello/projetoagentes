"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react"; // Or any other suitable icon

interface FeedbackButtonProps {
  onClick: () => void;
}

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ onClick }) => {
  return (
    <Button variant="outline" size="sm" onClick={onClick} title="Enviar Feedback">
      <MessageSquareText className="mr-2 h-4 w-4" />
      Feedback
    </Button>
  );
};
