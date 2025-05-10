
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

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { id, email } = session.user;
          setCurrentUser({ id, email: email || "" });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const { id, email } = session.user;
          setCurrentUser({ id, email: email || "" });
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        toast({
          title: "Success",
          description: "You've successfully logged in",
        });
      }
    } catch (error: any) {
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
      // Try to sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.log("Registration error:", error); // Debug log
        
        // Handle specific case when email is already in use
        if (error.message?.includes("already registered")) {
          toast({
            title: "Error",
            description: "Email is already registered. Please login instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to create account. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }
      
      if (data.user) {
        toast({
          title: "Success",
          description: "Account created successfully! Please check your email for verification.",
        });
      }
    } catch (error: any) {
      console.error("Unexpected error during registration:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
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
