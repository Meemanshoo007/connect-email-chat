
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/ChatMessage";
import { User } from "@/context/AuthContext";

export const useChatSubscription = (
  currentUser: User,
  selectedUser: User,
  onMessageReceived: (message: Message) => void
) => {
  useEffect(() => {
    console.log("Setting up real-time subscription");
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('public:chat_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages'
      }, (payload) => {
        const newMessage = payload.new as Message;
        console.log("Real-time message received:", newMessage);
        
        // Only add message if it's between the current conversation
        if ((newMessage.sender_id === currentUser.id && newMessage.recipient_id === selectedUser.id) ||
            (newMessage.sender_id === selectedUser.id && newMessage.recipient_id === currentUser.id)) {
          console.log("Adding message to chat:", newMessage);
          onMessageReceived(newMessage);
        }
      })
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, selectedUser.id, onMessageReceived]);
};
