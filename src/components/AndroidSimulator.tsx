/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ConnectionStatus } from "../types";
import { Signal, Battery, Wifi, Clock } from "lucide-react";

interface AndroidSimulatorProps {
  children: React.ReactNode;
  status: ConnectionStatus;
}

/**
 * A UI wrapper that mimics an Android device frame.
 * Includes a status bar with dynamic connection indicator.
 */
export const AndroidSimulator: React.FC<AndroidSimulatorProps> = ({ children, status }) => {
  const [time, setTime] = React.useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED: return "bg-green-500";
      case ConnectionStatus.CONNECTING: return "bg-yellow-500";
      case ConnectionStatus.OFFLINE: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900 p-4">
      <div className="relative w-[380px] h-[800px] bg-black rounded-[3rem] border-[8px] border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-zinc-800 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-12 h-1 bg-zinc-900 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="h-12 bg-zinc-100 flex items-center justify-between px-8 pt-4 pb-2 text-zinc-900 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
              <span className="uppercase tracking-tighter font-bold text-[10px]">
                {status}
              </span>
            </div>
            <Wifi size={14} />
            <Signal size={14} />
            <Battery size={14} />
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Navigation Bar */}
        <div className="h-12 bg-zinc-100 flex items-center justify-around px-12 border-t border-zinc-200">
          <div className="w-4 h-4 border-2 border-zinc-400 rounded-sm rotate-45" />
          <div className="w-5 h-5 border-2 border-zinc-400 rounded-full" />
          <div className="w-4 h-4 border-2 border-zinc-400 rounded-md" />
        </div>
      </div>
    </div>
  );
};
