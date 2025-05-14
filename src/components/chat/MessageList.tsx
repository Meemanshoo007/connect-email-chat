
import React, { useRef, useEffect } from "react";
import { Message } from "../ChatMessage";
import ChatMessage from "../ChatMessage";
import { User } from "@/context/AuthContext";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  currentUser: User;
  selectedUser: User;
  onResend: (message: Message) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  currentUser,
  selectedUser,
  onResend
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-brand-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <>
      {messages.map(message => (
        <ChatMessage 
          key={message.id} 
          message={message} 
          isCurrentUser={message.sender_id === currentUser.id}
          senderEmail={
            message.sender_id === currentUser.id 
              ? currentUser.email 
              : selectedUser.email
          }
          onResend={
            message.status === "failed" 
              ? () => onResend(message) 
              : undefined
          }
        />
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};

export default MessageList;
