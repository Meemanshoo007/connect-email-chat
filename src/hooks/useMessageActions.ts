
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/ChatMessage";
import { User } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "@/lib/utils";

export const useMessageActions = (
  currentUser: User,
  selectedUser: User,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) => {
  const { toast } = useToast();

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create a temporary message ID for optimistic updates
    const tempId = uuidv4();
    
    // Create the message object
    const newMsg = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      status: "sending" as const
    };

    // Add message to local state immediately (optimistic update)
    setMessages(prevMessages => [...prevMessages, newMsg]);
    
    try {
      console.log("Sending message:", newMsg);

      // Send to server, excluding the temporary id and status
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: newMsg.sender_id,
          recipient_id: newMsg.recipient_id,
          content: newMsg.content,
        }]);

      if (error) throw error;
      
      // Message sent successfully
      // The real-time subscription will update the message with the real ID
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      
      // Mark the message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === tempId 
            ? { ...msg, status: "failed" as const } 
            : msg
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to send message. You can try again.",
        variant: "destructive",
      });
    }
  };

  const resendMessage = async (failedMessage: Message) => {
    // Remove the failed message
    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== failedMessage.id)
    );
    
    // Create a new message with the same content
    const newMsg = {
      id: uuidv4(),
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: failedMessage.content,
      timestamp: new Date().toISOString(),
      status: "sending" as const
    };
    
    // Add new message to local state
    setMessages(prevMessages => [...prevMessages, newMsg]);
    
    try {
      // Send to server
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          sender_id: newMsg.sender_id,
          recipient_id: newMsg.recipient_id,
          content: newMsg.content,
        }]);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error resending message:", error.message);
      
      // Mark the message as failed
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === newMsg.id 
            ? { ...msg, status: "failed" as const } 
            : msg
        )
      );
      
      toast({
        title: "Error",
        description: "Failed to resend message. You can try again.",
        variant: "destructive",
      });
    }
  };

  return {
    sendMessage,
    resendMessage
  };
};
