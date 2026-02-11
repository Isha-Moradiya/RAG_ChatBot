"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Paperclip,
  FileText,
  X,
  Edit,
  Sparkles,
  Menu,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthPage from "@/components/auth-page";
import GeminiGreeting from "@/components/gemini-greeting";
import ProfileDropdown from "@/components/profile-dropdown";
import { SessionManager } from "@/components/session-manager";
import { useAuthContext } from "@/components/auth-provider";
import { toast } from "sonner";
import { ChatSession, GeneratedFile, GenerationType } from "@/types";
import { sendMessage } from "@/utils/chatService";
import { createSession, getSessions } from "@/utils/sessionService";
import ChatResponse from "@/components/chat-response";
import {
  canGenerateFromFile,
  detectGenerationType,
  formatGenerationPrompt,
  getGenerationSuggestions,
  isGenerationRequest,
} from "@/lib/generationType";
import {
  cleanupFileUrl,
  createDownloadableFile,
  generateFile,
} from "@/utils/fileGenerateService";
import { GeneratedFilePreview } from "@/components/generate-file";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  attachments?: FileAttachment[];
  generatedFile?: GeneratedFile;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
  isImage: boolean;
}

export default function App() {
  const { user, loading, logout } = useAuthContext();
  const [showGreeting, setShowGreeting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Gemini, your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageText, setEditedMessageText] = useState("");

  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingFileId, setRegeneratingFileId] = useState<string | null>(
    null
  );

  // Session management state
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [showSessionManager, setShowSessionManager] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      // Cleanup all blob URLs when component unmounts
      generatedFiles.forEach((file) => {
        cleanupFileUrl(file.url);
      });
    };
  }, []);

  const handleStartChat = async (initialPrompt?: string) => {
    setShowGreeting(false);

    // If there's an initial prompt, add it as a user message
    if (initialPrompt) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: initialPrompt,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Show typing indicator
      setIsTyping(true);

      try {
        // Prepare messages for API (only user messages)
        const apiMessages = [
          {
            role: "user",
            text: initialPrompt,
            content: initialPrompt,
            attachments: [],
          },
        ];

        // Call API - routing is handled automatically based on attachments
        const response = await sendMessage(
          apiMessages as any,
          [],
          currentSession ? currentSession.id : undefined
        );

        if (!response.data) {
          throw new Error("No response data received from server");
        }

        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.reply,
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
      } catch (error: any) {
        console.error("Error starting chat:", error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: error.message || "An error occurred. Please try again.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setMessages([
        {
          id: "1",
          text: "Hello! I'm Gemini, your AI assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setInputText("");
      setSelectedFiles([]);
      setShowGreeting(true);
      setCurrentSession(null);
      setShowSessionManager(false);
      toast.success("Successfully logged out!");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout. Please try again.");
    }
  };

  const handleSessionSelect = async (session: ChatSession) => {
    try {
      setCurrentSession(session);
      setShowSessionManager(false);

      // Load session messages
      const sessions = await getSessions();
      const sessionData = sessions.find((s: any) => s.id === session.id);
      if (!sessionData) {
        throw new Error("No session data received");
      }
      const sessionMessages: Message[] =
        sessionData.messages?.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.role === "user" ? "user" : "bot",
          timestamp: new Date(msg.timestamp),
          attachments: msg.attachments,
        })) || [];

      setMessages(sessionMessages);
      toast.success(`Loaded session: ${session.name}`);
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load session");
    }
  };

  const handleNewSession = async () => {
    try {
      const newSession = await createSession();
      if (!newSession) {
        throw new Error("Failed to create session");
      }
      setCurrentSession(newSession);
      setMessages([
        {
          id: "1",
          text: "Hello! I'm Gemini, your AI assistant. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
      setShowSessionManager(false);
      toast.success("New chat session created!");
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create new session");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const isImageFile = (type: string) => {
    return type.startsWith("image/");
  };

  const handleFileSelect = async (files: FileList) => {
    const newFiles: FileAttachment[] = [];

    for (const file of Array.from(files)) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        // Convert file to base64
        const base64 = await fileToBase64(file);

        const fileAttachment: FileAttachment = {
          id: Date.now().toString() + Math.random().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64,
          isImage: isImageFile(file.type),
        };
        newFiles.push(fileAttachment);
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error(`Failed to process file ${file.name}`);
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
      attachments: selectedFiles.length > 0 ? [...selectedFiles] : undefined,
    };

    setMessages((prev) => [...prev, newMessage]);

    // Check if this is a generation request
    const generationType = detectGenerationType(inputText);
    const hasGeneratableFiles = selectedFiles.some((file) =>
      canGenerateFromFile(file.type, file.name)
    );

    const isGenRequest =
      generationType &&
      hasGeneratableFiles &&
      isGenerationRequest(inputText, selectedFiles.length > 0);

    const currentInputText = inputText;
    const currentFiles = [...selectedFiles];

    setInputText("");
    setSelectedFiles([]);

    // Show typing indicator
    setIsTyping(true);

    try {
      if (isGenRequest) {
        // Handle file generation
        const success = await handleFileGeneration(
          currentInputText,
          currentFiles,
          generationType
        );
        if (success) {
          return; // Don't proceed with regular chat if generation was successful
        }
      }
      // Prepare messages for API (full conversation history, excluding initial greeting)
      const apiMessages = messages
        .filter(
          (msg) =>
            !(msg.sender === "bot" && msg.text.includes("Hello! I'm Gemini"))
        )
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          text: msg.text,
          content: msg.text,
          attachments: msg.attachments || [],
        }));

      // Add current user message
      const currentAttachments = selectedFiles.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        mimeType: file.type, // Add mimeType for backend compatibility
        data: file.data,
        isImage: file.isImage,
        url: `data:${file.type};base64,${file.data}`, // Add url for type compatibility
      }));

      apiMessages.push({
        role: "user",
        text: inputText,
        content: inputText,
        attachments: currentAttachments,
      });

      // Call API - routing is handled automatically based on attachments
      const response = await sendMessage(
        apiMessages as any,
        currentAttachments,
        currentSession ? currentSession.id : undefined
      );

      if (!response.data) {
        throw new Error("No response data received from server");
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.reply,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Use only the error message from the backend
      const errorText = error.message || "An error occurred. Please try again.";

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileGeneration = async (
    userMessage: string,
    attachments: FileAttachment[],
    generationType: GenerationType
  ) => {
    setIsGenerating(true);

    try {
      // Prepare messages for generation API
      const apiMessages = messages
        .filter(
          (msg) =>
            !(msg.sender === "bot" && msg.text.includes("Hello! I'm Gemini"))
        )
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          text: msg.text,
          content: msg.text,
          attachments: msg.attachments || [],
        }));

      // Add current user message
      const currentAttachments = attachments.map((file) => ({
        id: file.id,
        name: file.name,
        size: file.size,
        type: file.type,
        mimeType: file.type,
        data: file.data,
        isImage: file.isImage,
        url: `data:${file.type};base64,${file.data}`,
      }));

      apiMessages.push({
        role: "user",
        text: formatGenerationPrompt(generationType, userMessage, attachments),
        content: formatGenerationPrompt(
          generationType,
          userMessage,
          attachments
        ),
        attachments: currentAttachments,
      });

      // Call generation API
      const response = await generateFile({
        messages: apiMessages,
        attachments: currentAttachments,
        sessionId: currentSession?.id,
        generationType: generationType,
      });

      if (response.success && response.data) {
        // Create downloadable file
        const generatedFile = createDownloadableFile(
          response.data.fileBuffer,
          response.data.fileName,
          response.data.contentType
        );

        // Add to generated files list
        setGeneratedFiles((prev) => [generatedFile, ...prev]);

        // Create a bot message with the generated file
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: `I've generated a ${
            generationType === "mcq"
              ? "MCQ sheet"
              : generationType === "research"
              ? "research paper"
              : "technical documentation"
          } based on your uploaded document. You can preview and download it below.`,
          sender: "bot",
          timestamp: new Date(),
          generatedFile: generatedFile,
        };

        setMessages((prev) => [...prev, botResponse]);

        return true;
      } else {
        throw new Error("Failed to generate file");
      }
    } catch (error: any) {
      console.error("File generation error:", error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I couldn't generate the file. ${
          error.message || "Please try again."
        }`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleSaveEdit();
      } else {
        handleSendMessage();
      }
    }
  };

  const handleEditMessage = (messageId: string, currentText: string) => {
    setEditingMessageId(messageId);
    setEditedMessageText(currentText);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !editedMessageText.trim()) {
      setEditingMessageId(null);
      setEditedMessageText("");
      return;
    }

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === editingMessageId
          ? { ...msg, text: editedMessageText.trim() }
          : msg
      )
    );
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageText("");
  };

  const handleRegenerateFile = async (generatedFile: GeneratedFile) => {
    setRegeneratingFileId(generatedFile.id);

    try {
      // Find the original message that created this file
      const originalMessage = messages.find(
        (msg) => msg.generatedFile?.id === generatedFile.id
      );

      if (!originalMessage) {
        throw new Error("Could not find original generation request");
      }

      // Find attachments from messages around the time of generation
      const relevantMessages = messages.filter(
        (msg) =>
          msg.timestamp.getTime() <= originalMessage.timestamp.getTime() &&
          msg.attachments &&
          msg.attachments.length > 0
      );

      const attachments = relevantMessages
        .flatMap((msg) => msg.attachments || [])
        .filter((att) => canGenerateFromFile(att.type, att.name));

      if (attachments.length === 0) {
        throw new Error("Could not find original attachments for regeneration");
      }

      // Regenerate with the same type
      const success = await handleFileGeneration(
        `Regenerate ${generatedFile.generationType}`,
        attachments,
        generatedFile.generationType
      );

      if (success) {
        // Remove old file URL to prevent memory leaks
        cleanupFileUrl(generatedFile.url);

        // Remove old file from list
        setGeneratedFiles((prev) =>
          prev.filter((f) => f.id !== generatedFile.id)
        );
      }
    } catch (error: any) {
      console.error("Regeneration error:", error);
      toast.error(`Failed to regenerate file: ${error.message}`);
    } finally {
      setRegeneratingFileId(null);
    }
  };

  const FileAttachmentComponent = ({
    attachment,
    showRemove = false,
    onRemove,
  }: {
    attachment: FileAttachment;
    showRemove?: boolean;
    onRemove?: () => void;
  }) => {
    const canGenerate = canGenerateFromFile(attachment.type, attachment.name);
    return (
      <div className="relative bg-[#444649] border border-[#5f6368] rounded-lg p-3 max-w-xs">
        {showRemove && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {attachment.isImage ? (
          <div className="space-y-2">
            <img
              src={`data:${attachment.type};base64,${attachment.data}`}
              alt={attachment.name}
              className="w-full h-32 object-cover rounded"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <div className="text-xs text-gray-300">
              <p className="truncate">{attachment.name}</p>
              <p>{formatFileSize(attachment.size)}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">
                {attachment.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(attachment.size)}
              </p>
              {canGenerate && (
                <p className="text-xs text-green-400 mt-1">
                  Ready for generation
                </p>
              )}
            </div>
          </div>
        )}
        {canGenerate && showRemove && (
          <div className="mt-2 text-xs text-gray-400">
            Try: "Generate MCQ", "Create research paper", or "Make
            documentation"
          </div>
        )}
      </div>
    );
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-semibold text-center italic text-sm animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show authentication page if not logged in
  if (!user) {
    return <AuthPage />;
  }

  // Show greeting screen after login
  if (user && showGreeting) {
    return <GeminiGreeting onStartChat={handleStartChat} />;
  }

  // Show chat interface if authenticated
  return (
    <div className="flex h-screen bg-[#202124] text-gray-100">
      {/* Session Manager Sidebar */}
      {showSessionManager && (
        <div className="w-80 bg-[#202124] border-r border-[#444649] p-4 overflow-y-auto">
          <SessionManager
            onSessionSelect={handleSessionSelect}
            currentSessionId={currentSession?.id}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#444649]">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSessionManager(!showSessionManager)}
              className="text-gray-400 hover:text-gray-200"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              {/* Gemini Logo */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-normal text-gray-100">
                  Gemini
                </span>
                <p className="text-sm text-gray-400">AI Assistant</p>
              </div>
            </div>

            {currentSession && (
              <div className="ml-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300">
                  {currentSession.name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewSession}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-200"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              New Chat
            </Button>

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
        </div>

        {/* Chat Messages */}
        <div className="w-screen flex-1 overflow-y-auto px-4 py-6 space-y-4 hide-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex items-start gap-3 max-w-[50%] ${
                  message.sender === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === "user"
                      ? "bg-blue-500"
                      : "bg-gradient-to-r from-blue-500 to-purple-600"
                  }`}
                >
                  {message.sender === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col w-full">
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-blue-500 text-white rounded-br-md"
                        : "bg-[#303134] text-gray-100 border border-[#444649] rounded-bl-md shadow-sm"
                    } relative group`}
                  >
                    {editingMessageId === message.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editedMessageText}
                          onChange={(e) => setEditedMessageText(e.target.value)}
                          className=" p-2 rounded-md bg-[#444649] text-gray-100 border border-[#5f6368] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                          rows={Math.max(
                            1,
                            editedMessageText.split("\n").length
                          )}
                          autoFocus
                          onBlur={handleSaveEdit} // Save on blur
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSaveEdit();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={handleCancelEdit}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-200 hover:bg-[#444649]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveEdit}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {message.text &&
                          (message.sender === "bot" ? (
                            <ChatResponse content={message.text} />
                          ) : (
                            <p className="text-sm leading-relaxed">
                              {message.text}
                            </p>
                          ))}

                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div
                              className={`${
                                message.text ? "mt-3 " : ""
                              } space-y-2`}
                            >
                              {message.attachments.map((attachment) => (
                                <FileAttachmentComponent
                                  key={attachment.id}
                                  attachment={attachment}
                                />
                              ))}
                            </div>
                          )}

                        {/* Generated File Preview */}
                        {message.generatedFile && (
                          <div className={`${message.text ? "mt-3 " : ""}`}>
                            <GeneratedFilePreview
                              generatedFile={message.generatedFile}
                              onRegenerate={() =>
                                handleRegenerateFile(message.generatedFile!)
                              }
                              onRemove={() => {
                                // Remove file from generated files list
                                setGeneratedFiles((prev) =>
                                  prev.filter(
                                    (f) => f.id !== message.generatedFile!.id
                                  )
                                );
                                // Clean up URL
                                cleanupFileUrl(message.generatedFile!.url);
                                // Remove from message
                                setMessages((prev) =>
                                  prev.map((msg) =>
                                    msg.id === message.id
                                      ? { ...msg, generatedFile: undefined }
                                      : msg
                                  )
                                );
                              }}
                              isRegenerating={
                                regeneratingFileId === message.generatedFile.id
                              }
                            />
                          </div>
                        )}

                        {message.sender === "user" && (
                          <Button
                            onClick={() =>
                              handleEditMessage(message.id, message.text)
                            }
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 w-7 h-7 bg-[#303134] border border-[#444649] rounded-full text-gray-400 hover:text-gray-200 hover:bg-[#444649] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <span
                    className={`text-xs text-gray-500 mt-1 ${
                      message.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {(isTyping || isGenerating) && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[80%]">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#303134] border border-[#444649] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    {/* {isGenerating && (
                      <span className="text-xs text-gray-400 ml-2">
                        Generating document...
                      </span>
                    )} */}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          className={`bg-[#202124] border-t border-[#444649] px-4 py-4 ${
            isDragOver ? "bg-[#303134] border-blue-700" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File Preview Area */}
          {selectedFiles.length > 0 && (
            <div className="mb-4 max-w-4xl mx-auto">
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file) => (
                  <FileAttachmentComponent
                    key={file.id}
                    attachment={file}
                    showRemove={true}
                    onRemove={() => removeFile(file.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Show generation suggestions */}
          {selectedFiles.some((file) =>
            canGenerateFromFile(file.type, file.name)
          ) && (
            <div className="my-3 p-3 bg-[#303134] border border-[#444649] rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                💡 You can generate content from your uploaded documents:
              </p>
              <div className="flex flex-wrap gap-2">
                {getGenerationSuggestions(selectedFiles).map(
                  (suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputText(suggestion.prompt);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-full border border-blue-500/30 transition-colors"
                    >
                      {suggestion.type === "mcq"
                        ? "📝 MCQ Sheet"
                        : suggestion.type === "research"
                        ? "📄 Research Paper"
                        : "📚 Documentation"}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Drag & Drop Overlay */}
          {isDragOver && (
            <div className="absolute inset-0 bg-[#202124] bg-opacity-90 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Paperclip className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-blue-400">
                  Drop files here to upload
                </p>
              </div>
            </div>
          )}

          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full px-4 py-3 pr-20 border border-[#444649] rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[#303134] text-gray-100 placeholder-gray-500"
                disabled={isTyping || !!editingMessageId}
              />

              {/* File Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-gray-200 transition-colors"
                disabled={isTyping || !!editingMessageId}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                onChange={(e) =>
                  e.target.files && handleFileSelect(e.target.files)
                }
                className="hidden"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={
                (!inputText.trim() && selectedFiles.length === 0) ||
                isTyping ||
                isGenerating ||
                !!editingMessageId
              } // Disable if typing or editing
              className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}{" "}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
