"use client";
import { Sparkles, Lightbulb, Code, Palette } from "lucide-react";
import { useAuthContext } from "./auth-provider";
import ProfileDropdown from "./profile-dropdown";
import { toast } from "sonner";

interface GeminiGreetingProps {
  onStartChat: (prompt?: string) => void;
}

export default function GeminiGreeting({ onStartChat }: GeminiGreetingProps) {
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  // const suggestions = [
  //   {
  //     icon: <Lightbulb className="w-5 h-5" />,
  //     title: "Brainstorm",
  //     description: "team bonding activities for our work retreat",
  //   },
  //   {
  //     icon: <Code className="w-5 h-5" />,
  //     title: "Code",
  //     description: "a simple website with HTML and CSS",
  //   },
  //   {
  //     icon: <Palette className="w-5 h-5" />,
  //     title: "Create",
  //     description: "a content calendar for a fitness brand",
  //   },
  //   {
  //     icon: <Sparkles className="w-5 h-5" />,
  //     title: "Help me write",
  //     description: "a professional email to request a meeting",
  //   },
  // ]

  // const handleSuggestionClick = (suggestion: any) => {
  //   const prompt = `${suggestion.title} ${suggestion.description}`;
  //   onStartChat(prompt);
  // };

  return (
    <div className="flex flex-col h-screen bg-[#202124] text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#444649]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Gemini Logo */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-normal text-gray-100">Gemini</span>
          </div>
        </div>

        {/* Profile Dropdown */}
        {user && (
          <ProfileDropdown 
            userName={user.displayName || "User"} 
            userEmail={user.email || ""} 
            userPhotoURL={user.photoURL || undefined}
            onLogout={handleLogout} 
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        {/* Gemini Logo Large */}
        <div className="mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4 mx-auto">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl text-gray-100 text-center font-bold my-4">
            Welcome to,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gemini Chat
            </span>
          </h1>
          <p className="text-md text-center text-gray-500 mb-6 max-w-2xl mx-auto leading-relaxed">
            I'm your AI-powered assistant, ready to help you with questions,
            creative tasks, problem-solving, and engaging conversations.
          </p>
        </div>

        {/* Suggestions Grid */}
        {/* <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="group p-4 rounded-xl border border-[#444649] hover:border-gray-600 hover:shadow-sm transition-all duration-200 text-left bg-[#303134] hover:bg-[#444649]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#444649] group-hover:bg-gray-600 flex items-center justify-center transition-colors">
                  <div className="text-gray-300">{suggestion.icon}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-100 mb-1">{suggestion.title}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{suggestion.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div> */}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#202124] border-t border-[#444649] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Enter a prompt here"
              className="w-full px-6 py-4 pr-12 border border-[#444649] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 placeholder-gray-500 bg-[#303134]"
              onKeyPress={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  onStartChat(e.currentTarget.value);
                }
              }}
            />
            <button
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-200 transition-colors"
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Enter a prompt here"]'
                ) as HTMLInputElement;
                if (input?.value.trim()) {
                  onStartChat(input.value);
                }
              }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>

          {/* Footer Text */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Gemini may display inaccurate info, including about people, so
              double-check its responses.{" "}
              <a href="#" className="text-blue-400 hover:underline">
                Your privacy & Gemini Apps
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
