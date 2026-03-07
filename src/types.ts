/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum MessageType {
  MSG = "msg",
  PING = "ping",
  PONG = "pong",
}

export interface UserProfile {
  username: string;
  avatar: string;
}

export interface ChatMessage {
  type: MessageType;
  text: string;
  timestamp: number;
  author: string;
  avatar?: string; // Added for user profiles
  id?: string; // Local ID for UI rendering
}

export enum ConnectionStatus {
  CONNECTED = "CONNECTED",
  CONNECTING = "CONNECTING",
  OFFLINE = "OFFLINE",
}

export interface UIState {
  messages: ChatMessage[];
  status: ConnectionStatus;
  reconnectAttempts: number;
  isFloodTesting: boolean;
}
