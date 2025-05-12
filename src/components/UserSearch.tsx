
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all users except current user
    fetchUsers();
    // Fetch recently chatted users
    fetchRecentlyChattedUsers();
  }, [currentUserId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, email')
        .neq('id', currentUserId);
      
      if (error) throw error;
      
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentlyChattedUsers = async () => {
    try {
      setLoading(true);
      // Get unique user IDs that the current user has recently chatted with
      const { data: sentMessages, error: sentError } = await supabase
        .from('chat_messages')
        .select('recipient_id, timestamp')
        .eq('sender_id', currentUserId)
        .order('timestamp', { ascending: false });
      
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('chat_messages')
        .select('sender_id, timestamp')
        .eq('recipient_id', currentUserId)
        .order('timestamp', { ascending: false });
      
      if (sentError || receivedError) throw sentError || receivedError;
      
      // Combine unique user IDs from sent and received messages
      const uniqueUserIds = new Set<string>();
      
      sentMessages?.forEach(msg => uniqueUserIds.add(msg.recipient_id));
      receivedMessages?.forEach(msg => uniqueUserIds.add(msg.sender_id));
      
      if (uniqueUserIds.size === 0) return;
      
      // Fetch user details for each unique user ID
      const { data: recentUsers, error: usersError } = await supabase
        .from('custom_users')
        .select('id, email')
        .in('id', Array.from(uniqueUserIds))
        .order('email');
      
      if (usersError) throw usersError;
      
      // Mark these users as recent chat contacts
      const recentContacts = recentUsers?.map(user => ({
        ...user,
        recentChat: true
      })) || [];
      
      setRecentlyChattedUsers(recentContacts);
    } catch (error) {
      console.error("Error fetching recent chats:", error);
    } finally {
      setLoading(false);
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
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin h-5 w-5 border-2 border-brand-500 rounded-full border-t-transparent"></div>
          </div>
        ) : displayUsers().length > 0 ? (
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
