
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: number;
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  senderEmail?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser, senderEmail }) => {
  const initials = senderEmail 
    ? senderEmail.substring(0, 2).toUpperCase() 
    : "U";
  
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      className={cn(
        "flex items-start gap-2 mb-4 animate-slide-up",
        isCurrentUser ? "flex-row-reverse" : ""
      )}
    >
      <Avatar className={cn("h-8 w-8", isCurrentUser ? "ml-2" : "mr-2")}>
        <AvatarFallback className={
          isCurrentUser ? "bg-brand-500 text-white" : "bg-gray-200 text-gray-700"
        }>
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="max-w-[75%]">
        <div 
          className={cn(
            "rounded-lg p-3",
            isCurrentUser 
              ? "bg-brand-500 text-white rounded-tr-none" 
              : "bg-gray-100 text-gray-800 rounded-tl-none"
          )}
        >
          {message.content}
        </div>
        <div 
          className={cn(
            "text-xs mt-1 text-gray-500",
            isCurrentUser ? "text-right" : "text-left"
          )}
        >
          {formattedTime}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
