
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User } from "lucide-react";
import { getMockUsers, User as UserType } from "@/context/AuthContext";

interface UserSearchProps {
  currentUserId: string;
  onSelectUser: (user: UserType) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ currentUserId, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);

  useEffect(() => {
    // Get all users except current user
    const allUsers = getMockUsers().filter(user => user.id !== currentUserId);
    setUsers(allUsers);
    setFilteredUsers(allUsers);
  }, [currentUserId]);

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
      
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <Button
              key={user.id}
              variant="ghost"
              className="w-full justify-start hover:bg-muted px-2 py-6"
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="h-9 w-9 mr-2">
                <AvatarFallback className="bg-brand-200 text-brand-700">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{user.email}</span>
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
