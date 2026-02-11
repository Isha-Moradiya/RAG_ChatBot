'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Edit,
  Search,
  MoreHorizontal,
} from 'lucide-react';

import { ChatSession, SessionStats } from '@/types';
import {
  getSessions,
  createSession,
  updateSessionName,
  deleteSession,
  getSessionStats,
} from '@/utils/sessionService';

interface SessionManagerProps {
  onSessionSelect: (session: ChatSession) => void;
  currentSessionId?: string;
  className?: string;
}

export function SessionManager({ onSessionSelect, currentSessionId, className }: SessionManagerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
    loadStats();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const userSessions = await getSessions();
      setSessions(userSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load chat sessions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const sessionStats = await getSessionStats();
      setStats(sessionStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCreateSession = async () => {
    try {
      setIsCreating(true);
      const newSession = await createSession();
      setSessions(prev => [newSession, ...prev]);
      await loadStats();
      toast({
        title: "Success",
        description: "New chat session created",
      });
      onSessionSelect(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create new session",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      await loadStats();
      toast({
        title: "Success",
        description: "Session deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleUpdateSessionName = async (sessionId: string, newName: string) => {
    try {
      await updateSessionName(sessionId, newName);
      setSessions(prev =>
        prev.map(session =>
          session.id === sessionId
            ? { ...session, name: newName, updatedAt: Date.now() }
            : session
        )
      );
      toast({
        title: "Success",
        description: "Session name updated",
      });
    } catch (error) {
      console.error('Error updating session name:', error);
      toast({
        title: "Error",
        description: "Failed to update session name",
        variant: "destructive",
      });
    }
  };

  const startEditing = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingSessionName(session.name);
  };

  const saveEdit = async () => {
    if (!editingSessionId || !editingSessionName.trim()) {
      setEditingSessionId(null);
      setEditingSessionName('');
      return;
    }
    await handleUpdateSessionName(editingSessionId, editingSessionName.trim());
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const filteredSessions = sessions.filter(session =>
    session.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper for formatting date
  const formatSessionDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Chat Sessions</h2>
          {stats && (
            <p className="text-sm text-gray-400">
              {stats.totalSessions} sessions • {stats.totalMessages} messages
            </p>
          )}
        </div>
        <Button
          onClick={handleCreateSession}
          disabled={isCreating}
          size="sm"
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search sessions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#303134] border-[#444649] text-gray-100 placeholder-gray-500"
        />
      </div>

      <Separator className="bg-[#444649]" />

      {/* Sessions List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No chat sessions found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery ? 'Try adjusting your search' : 'Create your first chat session'}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              className={`cursor-pointer transition-all duration-200 hover:bg-[#303134] border-[#444649] ${
                currentSessionId === session.id ? 'bg-[#303134] border-blue-500' : 'bg-[#202124]'
              }`}
              onClick={() => onSessionSelect(session)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingSessionName}
                          onChange={(e) => setEditingSessionName(e.target.value)}
                          className="flex-1 bg-[#444649] border-[#5f6368] text-gray-100"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveEdit();
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          onBlur={saveEdit}
                        />
                        <Button size="sm" onClick={saveEdit} className="bg-blue-500 hover:bg-blue-600">
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-100 truncate">
                            {session.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {session.messageCount} messages
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-400">
                              {formatSessionDate(session.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {editingSessionId !== session.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#303134] border-[#444649]">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(session);
                          }}
                          className="text-gray-200 hover:bg-[#444649]"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}