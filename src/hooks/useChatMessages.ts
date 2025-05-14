import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/components/ChatMessage";
import { User } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "@/lib/utils";

export const useChatMessages = (currentUser: User, selectedUser: User) => {
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
        }
      })
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Cleaning up subscription");
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, selectedUser.id, toast]);

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
    messages,
    loading,
    sendMessage,
    resendMessage
  };
};
