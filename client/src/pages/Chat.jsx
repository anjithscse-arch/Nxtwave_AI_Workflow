import React, { useEffect } from 'react';
import useChatStore from '../store/chatStore.js';
import { subscribeToPipelineEvents } from '../services/socket.js';
import PipelineTimeline from '../components/PipelineTimeline/PipelineTimeline.jsx';
import ChatWindow from '../components/ChatWindow/ChatWindow.jsx';
import { PlusCircle, MessageSquare, Trash2, Sparkles } from 'lucide-react';

export function Chat() {
  const {
    sessions,
    currentSession,
    messages,
    liveTimeline,
    isGenerating,
    error,
    fetchSessions,
    createSession,
    selectSession,
    sendMessage,
    deleteSession,
    handlePipelineStageEvent
  } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    // Subscribe to real-time Socket.IO pipeline events
    const unsubscribe = subscribeToPipelineEvents((stageEvent) => {
      handlePipelineStageEvent(stageEvent);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 flex flex-col gap-4 max-w-7xl w-full mx-auto overflow-hidden">
      {/* Real-time Pipeline Stage Timeline */}
      <PipelineTimeline
        liveTimeline={liveTimeline}
        isGenerating={isGenerating}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 overflow-hidden min-h-[480px]">
        {/* Sessions Sidebar */}
        <div className="hidden md:flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl p-3 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Conversations
            </h3>
            <button
              onClick={() => createSession('New Conversation')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Start new conversation"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-1.5 pr-1">
            {sessions.length === 0 && (
              <p className="text-center text-xs text-slate-500 py-8">
                No conversations yet
              </p>
            )}

            {sessions.map((s) => {
              const isActive = currentSession?._id === s._id;

              return (
                <div
                  key={s._id}
                  onClick={() => selectSession(s._id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 group ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/40 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate max-w-[140px]">{s.title || 'Untitled Session'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s._id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Stream & Composer */}
        <div className="md:col-span-3 flex flex-col h-full overflow-hidden">
          <ChatWindow
            messages={messages}
            isGenerating={isGenerating}
            onSendMessage={sendMessage}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}

export default Chat;
