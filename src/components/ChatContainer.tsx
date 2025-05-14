
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import ChatMessage, { Message } from "./ChatMessage";
import { User } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "@/lib/utils";

interface ChatContainerProps {
  currentUser: User;
  selectedUser: User;
  onBack?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ currentUser, selectedUser, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
          // Fix: explicitly type the status as one of the allowed string literals
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create a temporary message ID for optimistic updates
    const tempId = uuidv4();
    
    // Create the message object
    const newMsg = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: selectedUser.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      status: "sending" as const
    };

    // Add message to local state immediately (optimistic update)
    setMessages(prevMessages => [...prevMessages, newMsg]);
    
    // Clear input field
    setNewMessage("");

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

  const handleResend = async (failedMessage: Message) => {
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center px-4 py-3 border-b bg-white shadow-sm">
        {onBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2 md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1">
          <h3 className="font-medium">{selectedUser.email}</h3>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white/50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin h-6 w-6 border-2 border-brand-500 rounded-full border-t-transparent"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map(message => (
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
                  ? () => handleResend(message) 
                  : undefined
              }
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form 
        onSubmit={handleSendMessage}
        className="border-t p-3 bg-white flex items-center gap-2"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          className="bg-brand-500 hover:bg-brand-600"
          disabled={!newMessage.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatContainer;
