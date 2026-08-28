import { create } from 'zustand';
import api from '../services/api.js';
import { joinSessionRoom, leaveSessionRoom } from '../services/socket.js';

export const useChatStore = create((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  liveTimeline: {}, // keyed by stage: { status, message, durationMs, metadata, level, timestamp }
  isGenerating: false,
  error: null,

  fetchSessions: async () => {
    try {
      const response = await api.get('/chat/sessions');
      const sessions = response.data.data;
      set({ sessions });

      // If no session is selected and sessions exist, select the first one
      if (!get().currentSession && sessions.length > 0) {
        get().selectSession(sessions[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  },

  createSession: async (title = 'New Conversation') => {
    try {
      const response = await api.post('/chat/sessions', { title });
      const newSession = response.data.data;

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        currentSession: newSession,
        messages: [],
        liveTimeline: {}
      }));

      joinSessionRoom(newSession._id);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      return null;
    }
  },

  selectSession: async (sessionId) => {
    const prevSession = get().currentSession;
    if (prevSession && prevSession._id) {
      leaveSessionRoom(prevSession._id);
    }

    try {
      joinSessionRoom(sessionId);
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      const { session, messages } = response.data.data;

      set({
        currentSession: session,
        messages,
        liveTimeline: {},
        error: null
      });
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  },

  sendMessage: async (question) => {
    if (!question || !question.trim()) return;

    let currentSession = get().currentSession;
    const optimisticUserMessage = {
      _id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString()
    };

    // Reset live timeline stages to initial state
    const initialStages = {
      guardrail: { status: 'running', message: 'Screening query for security...', level: 'info' },
      retrieval: { status: 'idle', message: 'Waiting for vector search...', level: 'info' },
      context: { status: 'idle', message: 'Waiting for similarity threshold...', level: 'info' },
      generation: { status: 'idle', message: 'Waiting for AI synthesis...', level: 'info' },
      citation: { status: 'idle', message: 'Waiting for citation attribution...', level: 'info' },
      monitoring: { status: 'idle', message: 'Waiting for audit logging...', level: 'info' }
    };

    set((state) => ({
      messages: [...state.messages, optimisticUserMessage],
      isGenerating: true,
      liveTimeline: initialStages,
      error: null
    }));

    try {
      const response = await api.post('/chat', {
        sessionId: currentSession ? currentSession._id : null,
        question
      });

      const data = response.data.data;

      // If this was a brand new session, update currentSession & sessions list
      if (!currentSession || currentSession._id !== data.sessionId) {
        currentSession = { _id: data.sessionId, title: question.slice(0, 30) };
        joinSessionRoom(data.sessionId);
        set((state) => ({
          currentSession,
          sessions: [currentSession, ...state.sessions.filter(s => s._id !== data.sessionId)]
        }));
      }

      const assistantMessage = {
        _id: data.messageId,
        role: 'assistant',
        content: data.content,
        blocked: data.blocked,
        blockReason: data.blockReason,
        aiProvider: data.aiProvider,
        retrievedSources: data.sources || [],
        createdAt: new Date().toISOString()
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isGenerating: false
      }));

      return data;
    } catch (error) {
      console.error('Chat query error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to generate response. Please try again.';

      set((state) => ({
        isGenerating: false,
        error: errorMsg
      }));
    }
  },

  handlePipelineStageEvent: (stageEvent) => {
    const { stage, level, message, durationMs, metadata } = stageEvent;

    set((state) => {
      const updatedTimeline = { ...state.liveTimeline };
      
      let status = 'success';
      if (level === 'blocked') status = 'blocked';
      else if (level === 'warning') status = 'warning';
      else if (level === 'error') status = 'error';
      else if (level === 'info' && !durationMs) status = 'running';

      updatedTimeline[stage] = {
        status,
        message,
        level,
        durationMs,
        metadata,
        timestamp: new Date()
      };

      return { liveTimeline: updatedTimeline };
    });
  },

  deleteSession: async (sessionId) => {
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      set((state) => {
        const remaining = state.sessions.filter((s) => s._id !== sessionId);
        const isCurrentDeleted = state.currentSession?._id === sessionId;
        return {
          sessions: remaining,
          currentSession: isCurrentDeleted ? (remaining[0] || null) : state.currentSession,
          messages: isCurrentDeleted ? [] : state.messages
        };
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  }
}));

export default useChatStore;
