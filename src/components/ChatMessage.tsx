
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  timestamp: number | string;
  read?: boolean;
  status?: "sending" | "sent" | "failed";
}

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  senderEmail?: string;
  onResend?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isCurrentUser, 
  senderEmail,
  onResend 
}) => {
  const initials = senderEmail 
    ? senderEmail.substring(0, 2).toUpperCase() 
    : "U";
  
  // Format timestamp as readable time
  const formatTime = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status indicator for the message
  const renderStatus = () => {
    if (!isCurrentUser) return null;

    switch (message.status) {
      case "sending":
        return <span className="text-xs text-gray-400">Sending...</span>;
      case "failed":
        return (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-500">Failed</span>
            <button 
              onClick={onResend} 
              className="p-1 rounded-full hover:bg-gray-100"
              title="Resend message"
            >
              <RefreshCcw className="h-3 w-3 text-red-500" />
            </button>
          </div>
        );
      default:
        return <span className="text-xs text-gray-400">Sent</span>;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-2 mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300",
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
            "flex items-center mt-1",
            isCurrentUser ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-xs text-gray-500 mr-2">
            {formatTime(message.timestamp)}
          </span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
