import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

const LogPanel: React.FC = () => {
  const messages = useSelector((state: RootState) => state.log.messages);
  const logEndRef = useRef<HTMLDivElement>(null); // Ref for scrolling

  // Scroll to bottom when messages update
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-grow bg-gray-800 p-2 rounded overflow-y-auto text-xs space-y-1">
      {messages.map((msg, index) => (
        <p key={index} className="whitespace-pre-wrap break-words">
          {/* Add simple indicator or timestamp if desired */}
          &gt; {msg}
        </p>
      ))}
      {/* Empty div to target for scrolling */}
      <div ref={logEndRef} />
    </div>
  );
};

export default LogPanel;
