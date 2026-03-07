/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { WebSocketManager } from "../services/WebSocketManager";
import { ChatMessage, ConnectionStatus, MessageType, UserProfile } from "../types";

const getRandomColor = () => {
  const r = Math.floor(Math.random() * 200); // Keep it a bit dark for contrast
  const g = Math.floor(Math.random() * 200);
  const b = Math.floor(Math.random() * 200);
  return `rgb(${r}, ${g}, ${b})`;
};

const DEFAULT_PROFILE: UserProfile = {
  username: "User_" + Math.floor(Math.random() * 1000),
  avatar: getRandomColor(),
};

/**
 * ViewModel for the Chat Screen.
 * Manages business logic, state, and message flow.
 */
export function useChatViewModel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.OFFLINE);
  const [isFloodTesting, setIsFloodTesting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // User Profile State
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("chat_user_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  // Persist profile
  useEffect(() => {
    localStorage.setItem("chat_user_profile", JSON.stringify(profile));
  }, [profile]);

  // Filtered messages for search
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(m => 
      m.text.toLowerCase().includes(query) || 
      m.author.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);
  
  // Use a ref for the manager to persist across renders
  const managerRef = useRef<WebSocketManager | null>(null);

  // Initialize manager
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}`;

    managerRef.current = new WebSocketManager(
      wsUrl,
      (newStatus) => setStatus(newStatus),
      (msg) => {
        setMessages((prev) => [...prev, { ...msg, id: Math.random().toString(36).substr(2, 9) }]);
      }
    );

    managerRef.current.connect();

    return () => {
      managerRef.current?.disconnect();
    };
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (text.trim()) {
      managerRef.current?.sendMessage(text, profile.username, profile.avatar);
    }
  }, [profile]);

  const connect = useCallback(() => {
    managerRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    managerRef.current?.disconnect();
  }, []);

  const startFloodTest = useCallback(async () => {
    if (isFloodTesting || status !== ConnectionStatus.CONNECTED) return;
    
    setIsFloodTesting(true);
    for (let i = 1; i <= 20; i++) {
      managerRef.current?.sendMessage(`Flood Test Message #${i}`, profile.username, profile.avatar);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    setIsFloodTesting(false);
  }, [isFloodTesting, status, profile]);

  return {
    messages: filteredMessages, // Return filtered messages
    allMessages: messages, // Keep all messages for search context
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
  };
}
