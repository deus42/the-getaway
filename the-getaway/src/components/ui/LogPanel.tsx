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
    <div
      style={{
        flexGrow: 1,
        backgroundColor: "#1f2937",
        padding: "0.5rem",
        borderRadius: "0.25rem",
        overflowY: "auto",
        fontSize: "0.75rem",
        color: "white",
      }}
    >
      {messages.map((msg, index) => (
        <p
          key={index}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginBottom: "0.25rem",
          }}
        >
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
