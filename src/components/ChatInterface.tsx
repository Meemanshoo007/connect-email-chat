
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { useAuth, User } from "@/context/AuthContext";
import UserSearch from "./UserSearch";
import ChatContainer from "./ChatContainer";

const ChatInterface: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    // On mobile, hide sidebar when user is selected
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
  };

  // Get initials from email
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (!currentUser) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar with user search */}
      {(showSidebar || window.innerWidth >= 768) && (
        <div className="w-full md:w-80 bg-white border-r flex flex-col">
          {/* User info header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-9 w-9 mr-2">
                <AvatarFallback className="bg-brand-500 text-white">
                  {getInitials(currentUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="truncate">
                <span className="font-medium">{currentUser.email}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="hover:bg-red-100 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* User search */}
          <UserSearch 
            currentUserId={currentUser.id} 
            onSelectUser={handleSelectUser} 
          />
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <ChatContainer 
            currentUser={currentUser} 
            selectedUser={selectedUser}
            onBack={handleBackToList}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Connect Chat</h3>
              <p className="text-gray-500 max-w-md">
                Search and select a user to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
