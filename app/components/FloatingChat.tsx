"use client";

import { useState } from "react";

export default function FloatingChat() {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-3">
      {/* Callout Bubble */}
      <div
        className={`origin-right transition-opacity duration-200 ${
          hovered ? "opacity-100" : "pointer-events-none hidden opacity-0 sm:block"
        }`}
      >
        <div className="glass-panel elevation-1 relative whitespace-nowrap rounded-xl px-4 py-2.5">
          <p className="text-sm font-semibold text-text-main">มีข้อสงสัย? คุยกับเราสิ</p>
          <p className="text-xs text-text-subtle">ตอบไวภายใน 1 นาที</p>
          <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-bg-surface border-r border-t border-border-subtle rotate-45" />
        </div>
      </div>

      <a
        id="line-chat-button"
        href="https://line.me/ti/p/@keyzaa"
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="elevation-1 h-[52px] w-[52px] rounded-full bg-bg-elevated text-text-main ring-1 ring-border-subtle/60 transition-all duration-200 hover:bg-bg-surface active:scale-[0.98] sm:h-[60px] sm:w-[60px]"
      >
        <svg className="h-7 w-7 sm:h-8 sm:w-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63h-2.013v1.477h2.013c.345 0 .63.283.63.63 0 .344-.285.63-.63.63h-2.643a.632.632 0 0 1-.627-.63V8.108c0-.345.282-.63.627-.63h2.643c.349 0 .63.285.63.63 0 .349-.281.63-.63.63h-2.013v1.125h2.013zm-4.87 3.368a.627.627 0 0 1-.63.63.617.617 0 0 1-.506-.262l-2.761-3.736v3.368a.628.628 0 0 1-.63.63.625.625 0 0 1-.625-.63V8.108a.627.627 0 0 1 .625-.63c.2 0 .384.095.506.262l2.761 3.736V8.108a.63.63 0 0 1 1.26 0v5.123zm-6.455 0a.63.63 0 0 1-1.26 0V8.108a.63.63 0 0 1 1.26 0v5.123zm-2.871.63H2.526a.627.627 0 0 1-.63-.63V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.493h1.643c.349 0 .63.283.63.63a.622.622 0 0 1-.63.63zM24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      </a>
    </div>
  );
}
