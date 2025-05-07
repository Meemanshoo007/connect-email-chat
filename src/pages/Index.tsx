
import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import ChatInterface from "@/components/ChatInterface";

const ChatApp: React.FC = () => {
  const { currentUser, loading, login, register } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-brand-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Show auth form if user is not logged in
  if (!currentUser) {
    return <AuthForm onLogin={login} onRegister={register} loading={loading} />;
  }

  // Show chat interface if user is logged in
  return <ChatInterface />;
};

const Index = () => {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
};

export default Index;
