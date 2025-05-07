
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";

// Define user type
export interface User {
  id: string;
  email: string;
}

// Create interface for context
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for provider
interface AuthProviderProps {
  children: ReactNode;
}

// Mock users for demo purposes (in a real app, this would be stored in a database)
const MOCK_USERS: User[] = [
  { id: "1", email: "user1@example.com" },
  { id: "2", email: "user2@example.com" },
  { id: "3", email: "user3@example.com" },
  { id: "4", email: "test@example.com" }
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("chat_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("chat_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user exists in our mock database
      const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (user) {
        // In a real app, we'd verify the password here
        setCurrentUser(user);
        localStorage.setItem("chat_user", JSON.stringify(user));
        toast({
          title: "Success",
          description: "You've successfully logged in",
        });
      } else {
        // Create new user if not found (for demo purposes)
        const newUser: User = { id: (MOCK_USERS.length + 1).toString(), email };
        MOCK_USERS.push(newUser);
        setCurrentUser(newUser);
        localStorage.setItem("chat_user", JSON.stringify(newUser));
        toast({
          title: "Success",
          description: "Logged in as a new user",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        toast({
          title: "Error",
          description: "Email is already registered. Please login instead.",
          variant: "destructive",
        });
      } else {
        // Create new user
        const newUser: User = { id: (MOCK_USERS.length + 1).toString(), email };
        MOCK_USERS.push(newUser);
        setCurrentUser(newUser);
        localStorage.setItem("chat_user", JSON.stringify(newUser));
        toast({
          title: "Success",
          description: "Account created successfully!",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("chat_user");
    toast({
      title: "Logged out",
      description: "You've been successfully logged out",
    });
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export mock users for the demo
export const getMockUsers = () => MOCK_USERS.filter(user => user.id !== "0");
