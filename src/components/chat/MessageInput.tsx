
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  loading: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, loading }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage("");
  };

  return (
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
  );
};

export default MessageInput;
