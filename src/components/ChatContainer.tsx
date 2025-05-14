
import React from "react";
import { User } from "@/context/AuthContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import ChatHeader from "./chat/ChatHeader";
import MessageList from "./chat/MessageList";
import MessageInput from "./chat/MessageInput";

interface ChatContainerProps {
  currentUser: User;
  selectedUser: User;
  onBack?: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ currentUser, selectedUser, onBack }) => {
  const { messages, loading, sendMessage, resendMessage } = useChatMessages(currentUser, selectedUser);

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <ChatHeader selectedUser={selectedUser} onBack={onBack} />

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 bg-white/50">
        <MessageList 
          messages={messages}
          loading={loading}
          currentUser={currentUser}
          selectedUser={selectedUser}
          onResend={resendMessage}
        />
      </div>

      {/* Message input */}
      <MessageInput onSendMessage={sendMessage} loading={loading} />
    </div>
  );
};

export default ChatContainer;
