
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { User } from "@/context/AuthContext";

interface ChatHeaderProps {
  selectedUser: User;
  onBack?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedUser, onBack }) => {
  return (
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
  );
};

export default ChatHeader;
