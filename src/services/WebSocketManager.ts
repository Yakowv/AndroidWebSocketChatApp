/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageType, ChatMessage, ConnectionStatus } from "../types";

/**
 * Manages WebSocket connection lifecycle,
 * reconnection logic, and message streaming.
 * 
 * Implements Exponential Backoff and Heartbeat mechanism.
 */
export class WebSocketManager {
  private socket: WebSocket | null = null;
  private statusCallback: (status: ConnectionStatus) => void;
  private messageCallback: (msg: ChatMessage) => void;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private heartbeatInterval: any = null;
  private reconnectTimeout: any = null;
  private url: string;
  private isManualDisconnect = false;

  constructor(
    url: string,
    onStatusChange: (status: ConnectionStatus) => void,
    onMessage: (msg: ChatMessage) => void
  ) {
    this.url = url;
    this.statusCallback = onStatusChange;
    this.messageCallback = onMessage;
  }

  /**
   * Initiates the connection to the WebSocket server.
   */
  public connect() {
    this.isManualDisconnect = false;
    this.cleanup();
    
    this.statusCallback(ConnectionStatus.CONNECTING);
    
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("WebSocket Connected");
        this.reconnectAttempts = 0;
        this.statusCallback(ConnectionStatus.CONNECTED);
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Protocol Rule: Only 'msg' should be rendered in the message list.
          if (data.type === MessageType.MSG) {
            this.messageCallback(data);
          } else if (data.type === MessageType.PONG) {
            console.log("Heartbeat PONG received");
          }
        } catch (e) {
          console.error("Invalid JSON received:", e);
        }
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket Closed", event.code);
        this.statusCallback(ConnectionStatus.OFFLINE);
        this.stopHeartbeat();
        
        if (!this.isManualDisconnect) {
          this.handleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
        // onclose will be called after onerror
      };
    } catch (e) {
      console.error("Connection failed:", e);
      this.statusCallback(ConnectionStatus.OFFLINE);
      this.handleReconnect();
    }
  }

  /**
   * Gracefully closes the connection.
   */
  public disconnect() {
    this.isManualDisconnect = true;
    this.cleanup();
    this.statusCallback(ConnectionStatus.OFFLINE);
  }

  /**
   * Sends a message through the WebSocket.
   */
  public sendMessage(text: string, author: string = "client", avatar?: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const msg: ChatMessage = {
        type: MessageType.MSG,
        text,
        timestamp: Date.now(),
        author,
        avatar
      };
      this.socket.send(JSON.stringify(msg));
    }
  }

  /**
   * Implements Exponential Backoff reconnection strategy.
   */
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached. Stopping.");
      return;
    }

    this.reconnectAttempts++;
    
    // Exponential Backoff: 5, 10, 20, 60 seconds
    const delays = [5000, 10000, 20000, 60000];
    const delay = delays[this.reconnectAttempts - 1] || 60000;

    console.log(`Reconnecting in ${delay / 1000}s (Attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Sends a JSON heartbeat message every 25 seconds.
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const ping: ChatMessage = {
          type: MessageType.PING,
          text: "",
          timestamp: Date.now(),
          author: "client"
        };
        this.socket.send(JSON.stringify(ping));
        console.log("Heartbeat PING sent");
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private cleanup() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.close();
      this.socket = null;
    }
  }
}
