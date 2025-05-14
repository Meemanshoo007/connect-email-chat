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
      // Check if this message is an update to a temporary message we sent (optimistic update)
      const tempMessage = prevMessages.find(m => 
        m.status === "sending" && 
        m.sender_id === newMessage.sender_id && 
        m.recipient_id === newMessage.recipient_id &&
        m.content === newMessage.content
      );
      
      if (tempMessage) {
        // Update the temporary message with server data and mark as sent
        return prevMessages.map(m => 
          m.id === tempMessage.id 
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
