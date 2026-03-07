/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { useChatViewModel } from "./hooks/useChatViewModel";
import { AndroidSimulator } from "./components/AndroidSimulator";
import { ConnectionStatus, UserProfile } from "./types";
import { Send, Zap, RefreshCw, LogOut, Search, User, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/**
 * Profile Modal Component
 */
const ProfileModal = ({ 
  profile, 
  onSave, 
  onClose 
}: { 
  profile: UserProfile; 
  onSave: (p: UserProfile) => void; 
  onClose: () => void; 
}) => {
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);

  const generateNewAvatar = () => {
    setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-900">User Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-100 shadow-inner">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <button 
              onClick={generateNewAvatar}
              className="absolute bottom-0 right-0 bg-zinc-900 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="w-full space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-zinc-900 focus:outline-none focus:border-zinc-300 transition-colors"
              placeholder="Enter username"
            />
          </div>

          <button 
            onClick={() => onSave({ username, avatar })}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
          >
            <Check size={20} />
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Production-Ready Chat Screen.
 * Implemented with Jetpack Compose-like patterns.
 */
export default function App() {
  const { 
    messages, 
    status, 
    isFloodTesting, 
    profile,
    setProfile,
    searchQuery,
    setSearchQuery,
    sendMessage, 
    connect, 
    disconnect, 
    startFloodTest 
  } = useChatViewModel();

  const [inputText, setInputText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Smart Scroll Logic
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(isNearBottom);
  };

  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <AndroidSimulator status={status}>
      <AnimatePresence>
        {isProfileOpen && (
          <ProfileModal 
            profile={profile} 
            onSave={(p) => {
              setProfile(p);
              setIsProfileOpen(false);
            }} 
            onClose={() => setIsProfileOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-zinc-100 shadow-sm z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          {!isSearching ? (
            <>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-10 h-10 rounded-full overflow-hidden border border-zinc-100 hover:scale-105 transition-transform"
                >
                  <img src={profile.avatar} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
                <div className="flex flex-col">
                  <h1 className="text-sm font-bold text-zinc-900 tracking-tight leading-none">{profile.username}</h1>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${status === ConnectionStatus.CONNECTED ? 'bg-green-500' : status === ConnectionStatus.CONNECTING ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">{status}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsSearching(true)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <Search size={20} />
                </button>
                <button 
                  onClick={startFloodTest}
                  disabled={status !== ConnectionStatus.CONNECTED || isFloodTesting}
                  className={`p-2 rounded-full transition-colors ${isFloodTesting ? 'bg-orange-100 text-orange-600 animate-pulse' : 'text-orange-600 hover:bg-orange-50'}`}
                >
                  <Zap size={20} />
                </button>
                {status === ConnectionStatus.OFFLINE ? (
                  <button onClick={connect} className="p-2 text-zinc-400 hover:text-zinc-900"><RefreshCw size={20} /></button>
                ) : (
                  <button onClick={disconnect} className="p-2 text-zinc-400 hover:text-zinc-900"><LogOut size={20} /></button>
                )}
              </div>
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex items-center gap-2"
            >
              <div className="flex-1 bg-zinc-50 rounded-xl px-3 py-2 flex items-center gap-2 border border-zinc-100">
                <Search size={16} className="text-zinc-400" />
                <input 
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-zinc-400 hover:text-zinc-900">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery("");
                }}
                className="text-sm font-bold text-zinc-900 px-2"
              >
                Cancel
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              {searchQuery ? <Search size={32} className="text-zinc-200" /> : <RefreshCw size={32} className="text-zinc-200" />}
            </div>
            <p className="text-zinc-400 text-sm font-medium">
              {searchQuery ? "No results found." : "No messages yet.\nStart the conversation."}
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.author === profile.username;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-100 flex-shrink-0 mt-1">
                    <img src={msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.author}`} alt={msg.author} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  
                  <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && <span className="text-[10px] font-bold text-zinc-400 mb-1 px-1">{msg.author}</span>}
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMe 
                          ? 'bg-zinc-900 text-white rounded-tr-none' 
                          : 'bg-zinc-100 text-zinc-900 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 px-1 font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-zinc-100 flex items-center gap-3">
        <div className="flex-1 bg-zinc-50 rounded-2xl px-4 py-3 flex items-center border border-zinc-100 focus-within:border-zinc-300 transition-colors">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400"
            disabled={status !== ConnectionStatus.CONNECTED}
          />
        </div>
        <button 
          onClick={handleSend}
          disabled={!inputText.trim() || status !== ConnectionStatus.CONNECTED}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            inputText.trim() && status === ConnectionStatus.CONNECTED
              ? 'bg-zinc-900 text-white shadow-lg active:scale-95' 
              : 'bg-zinc-100 text-zinc-300'
          }`}
        >
          <Send size={20} />
        </button>
      </div>
    </AndroidSimulator>
  );
}
