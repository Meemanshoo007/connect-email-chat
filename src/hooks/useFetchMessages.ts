
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/ChatMessage";
import { User } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useFetchMessages = (currentUser: User, selectedUser: User) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch chat messages between current user and selected user
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .or(`sender_id.eq.${selectedUser.id},recipient_id.eq.${selectedUser.id}`)
          .order('timestamp', { ascending: true });
        
        if (error) {
          throw error;
        }

        // Filter to only include messages between the two users
        const filteredMessages = data?.filter(msg => 
          (msg.sender_id === currentUser.id && msg.recipient_id === selectedUser.id) || 
          (msg.sender_id === selectedUser.id && msg.recipient_id === currentUser.id)
        ) || [];
        
        // Add status "sent" to all existing messages from the current user
        const messagesWithStatus = filteredMessages.map(msg => ({
          ...msg,
          status: msg.sender_id === currentUser.id ? ("sent" as const) : undefined
        }));
        
        setMessages(messagesWithStatus as Message[]);
      } catch (error: any) {
        console.error("Error fetching messages:", error.message);
        toast({
          title: "Error",
          description: "Failed to load messages. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser.id, selectedUser.id, toast]);

  return { messages, setMessages, loading };
};
