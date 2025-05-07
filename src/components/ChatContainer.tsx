
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import ChatMessage, { Message } from "./ChatMessage";
import { User } from "@/context/AuthContext";

interface ChatContainerProps {
  currentUser: User;
  selectedUser: User;
  onBack?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ currentUser, selectedUser, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // In a real app, this would fetch messages from a database
  useEffect(() => {
    // Simulate loading existing messages
    const storedMessages = localStorage.getItem(`chat_${currentUser.id}_${selectedUser.id}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      // Create sample messages for demo
      const sampleMessages = [
        {
          id: "1",
          senderId: selectedUser.id,
          recipientId: currentUser.id,
          content: "Hello there!",
          timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        },
        {
          id: "2",
          senderId: currentUser.id,
          recipientId: selectedUser.id,
          content: "Hi! How are you?",
          timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
        },
        {
          id: "3",
          senderId: selectedUser.id,
          recipientId: currentUser.id,
          content: "I'm doing well, thanks for asking. How about you?",
          timestamp: Date.now() - 1000 * 60 * 25, // 25 minutes ago
        },
      ];
      setMessages(sampleMessages);
      localStorage.setItem(`chat_${currentUser.id}_${selectedUser.id}`, JSON.stringify(sampleMessages));
    }
  }, [currentUser.id, selectedUser.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      recipientId: selectedUser.id,
      content: newMessage.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    localStorage.setItem(`chat_${currentUser.id}_${selectedUser.id}`, JSON.stringify(updatedMessages));
    setNewMessage("");
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
            Back
          </Button>
        )}
        <div className="flex-1">
          <h3 className="font-medium">{selectedUser.email}</h3>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white/50">
        {messages.map(message => (
          <ChatMessage 
            key={message.id} 
            message={message} 
            isCurrentUser={message.senderId === currentUser.id}
            senderEmail={
              message.senderId === currentUser.id 
                ? currentUser.email 
                : selectedUser.email
            }
          />
        ))}
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
          disabled={!newMessage.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatContainer;
