
import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Check if user is already logged in (from session storage)
  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing stored user:", error);
        sessionStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Check if a user with this email exists
      const { data: users, error: fetchError } = await supabase
        .from('custom_users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (!users || users.length === 0) {
        toast({
          title: "Error",
          description: "No account found with this email. Please register first.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const user = users[0];
      
      // Check if password matches (simple comparison for now)
      // In a real app, you would use bcrypt or another secure method
      if (user.password !== password) {
        toast({
          title: "Error",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Set the current user
      const currentUser = {
        id: user.id,
        email: user.email
      };
      
      // Store user in session storage
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      setCurrentUser(currentUser);
      
      toast({
        title: "Success",
        description: "You've successfully logged in",
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Check if email is already registered
      const { data: existingUsers, error: checkError } = await supabase
        .from('custom_users')
        .select('email')
        .eq('email', email)
        .limit(1);
      
      if (checkError) {
        throw checkError;
      }
      
      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: "Error",
          description: "Email is already registered. Please login instead.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Register the new user
      const { data: newUser, error: insertError } = await supabase
        .from('custom_users')
        .insert([{ email, password }])
        .select()
        .single();
      
      if (insertError) {
        throw insertError;
      }
      
      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Remove user from session storage
    sessionStorage.removeItem('currentUser');
    setCurrentUser(null);
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
export const getMockUsers = () => [];
