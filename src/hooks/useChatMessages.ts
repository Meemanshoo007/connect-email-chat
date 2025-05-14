import { useState } from "react";
import { Message } from "@/components/ChatMessage";
import { User } from "@/context/AuthContext";
import { useFetchMessages } from "./useFetchMessages";
import { useChatSubscription } from "./useChatSubscription";
import { useMessageActions } from "./useMessageActions";

export const useChatMessages = (currentUser: User, selectedUser: User) => {
  // Use the fetch messages hook
  const { messages, setMessages, loading } = useFetchMessages(currentUser, selectedUser);
  
  // Use the message actions hook
  const { sendMessage, resendMessage } = useMessageActions(currentUser, selectedUser, setMessages);

  // Handle incoming messages from real-time subscription
  const handleMessageReceived = (newMessage: Message) => {
    setMessages(prevMessages => {
      // Check if this message already exists (might be an optimistic update)
      const existingMessage = prevMessages.find(m => m.id === newMessage.id);
      if (existingMessage) {
        // Update the existing message with server data and mark as sent
        return prevMessages.map(m => 
          m.id === newMessage.id 
            ? { ...newMessage, status: "sent" as const } 
            : m
        );
      }
      
      // Otherwise add as a new message
      return [...prevMessages, newMessage];
    });
  };

  // Use the chat subscription hook
  useChatSubscription(currentUser, selectedUser, handleMessageReceived);

  return {
    messages,
    loading,
    sendMessage,
    resendMessage
  };
};
