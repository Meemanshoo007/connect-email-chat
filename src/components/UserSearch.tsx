
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserSearchProps {
  currentUserId: string;
  onSelectUser: (user: UserType) => void;
}

export interface UserType {
  id: string;
  email: string;
  recentChat?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [recentlyChattedUsers, setRecentlyChattedUsers] = useState<UserType[]>([]);

  useEffect(() => {
    // Fetch all users except current user
    fetchUsers();
    // Fetch recently chatted users
    fetchRecentlyChattedUsers();
  }, [currentUserId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, email')
        .neq('id', currentUserId);
      
      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchRecentlyChattedUsers = async () => {
    // Here we would fetch users that the current user has chatted with
    // For this example, we'll simulate this with a dummy list
    // In a real application, you would query a messages or chats table
    
    // Placeholder for recently chatted users - this should be replaced with actual database query
    try {
      // This is a placeholder - in a real implementation, you would query your messages/chats table
      // to find users the current user has chatted with
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, email')
        .neq('id', currentUserId)
        .limit(3); // Just as an example to show some users
      
      if (error) throw error;
      
      const recentUsers = data?.map(user => ({
        ...user,
        recentChat: true
      })) || [];
      
      setRecentlyChattedUsers(recentUsers);
    } catch (error) {
      console.error("Error fetching recent chats:", error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (term) {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  // Combine recent users at the top, then other users
  const displayUsers = () => {
    if (searchTerm) {
      return filteredUsers;
    }
    
    // Get ids of recently chatted users to avoid duplicates
    const recentIds = recentlyChattedUsers.map(user => user.id);
    
    // Filter out recently chatted users from the regular users list
    const otherUsers = users.filter(user => !recentIds.includes(user.id));
    
    // Return recently chatted users first, then other users
    return [...recentlyChattedUsers, ...otherUsers];
  };

  return (
    <div className="p-4 border-b">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      {recentlyChattedUsers.length > 0 && !searchTerm && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Chats</h3>
        </div>
      )}
      
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {displayUsers().length > 0 ? (
          displayUsers().map(user => (
            <Button
              key={user.id}
              variant="ghost"
              className="w-full justify-start hover:bg-muted px-2 py-6"
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="h-9 w-9 mr-2">
                <AvatarFallback className={user.recentChat ? "bg-brand-500 text-white" : "bg-brand-200 text-brand-700"}>
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex items-center">
                <span className="truncate">{user.email}</span>
                {user.recentChat && (
                  <MessageSquare className="h-4 w-4 ml-2 text-brand-500" />
                )}
              </div>
            </Button>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm ? "No users found" : "No users available"}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSearch;
