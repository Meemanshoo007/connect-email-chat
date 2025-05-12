
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, ArrowLeft } from "lucide-react";
import ChatMessage, { Message } from "./ChatMessage";
import { User } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
        
        setMessages(filteredMessages);
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
        // Only add message if it's between the current conversation
        if ((newMessage.sender_id === currentUser.id && newMessage.recipient_id === selectedUser.id) ||
            (newMessage.sender_id === selectedUser.id && newMessage.recipient_id === currentUser.id)) {
          setMessages(prevMessages => [...prevMessages, newMessage]);
        }
      })
      .subscribe();

    return () => {
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

    try {
      const newMsg = {
        sender_id: currentUser.id,
        recipient_id: selectedUser.id,
        content: newMessage.trim(),
      };

      const { error } = await supabase
        .from('chat_messages')
        .insert([newMsg]);

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
