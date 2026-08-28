import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, MessageSquare, Trash2, ArrowRight, Clock, Bot } from 'lucide-react';
import useChatStore from '../store/chatStore.js';
import api from '../services/api.js';

export function History() {
  const { sessions, fetchSessions, selectSession, deleteSession } = useChatStore();
  const navigate = useNavigate();
  const [selectedSessionData, setSelectedSessionData] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSelect = async (sessionId) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/sessions/${sessionId}/messages`);
      setSelectedSessionData(res.data.data);
    } catch (err) {
      console.error('Failed to load session details:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleResume = (sessionId) => {
    selectSession(sessionId);
    navigate('/chat');
  };

  return (
    <div className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
      {/* Sessions List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <HistoryIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Conversation History</h2>
            <p className="text-xs text-slate-400">{sessions.length} recorded session(s)</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-2 pr-1">
          {sessions.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No chat history recorded yet</p>
            </div>
          )}

          {sessions.map((s) => {
            const isSelected = selectedSessionData?.session?._id === s._id;

            return (
              <div
                key={s._id}
                onClick={() => handleSelect(s._id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                    : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-slate-200 truncate">{s.title || 'Untitled'}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s._id);
                      if (selectedSessionData?.session?._id === s._id) {
                        setSelectedSessionData(null);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(s.lastMessageAt || s.createdAt).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages Preview Panel */}
      <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col overflow-hidden">
        {selectedSessionData ? (
          <>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">{selectedSessionData.session?.title}</h3>
                <p className="text-xs text-slate-400">
                  {selectedSessionData.messages?.length || 0} messages in this thread
                </p>
              </div>
              <button
                onClick={() => handleResume(selectedSessionData.session._id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all"
              >
                <span>Continue Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {selectedSessionData.messages?.map((m) => (
                <div
                  key={m._id}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-100 ml-8'
                      : m.blocked
                      ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200 mr-8'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px] mb-1 text-slate-400">
                    <span>{m.role === 'user' ? 'Student' : 'CampusMind AI'}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500">
            <Bot className="w-12 h-12 mb-3 stroke-[1.5] text-slate-600" />
            <p className="text-sm font-semibold">Select a conversation from the left</p>
            <p className="text-xs text-slate-600 mt-1">Review turns, answers, and source citations</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
