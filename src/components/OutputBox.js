import React from "react";

const OutputBox = ({ output }) => {
  return (
    <div
      style={{
        background: "#1e1e1e",
        color: "#fff",
        height: "100%",
        padding: "10px",
        borderLeft: "2px solid #333",
        overflowY: "auto",
      }}
    >
      <h3>Output</h3>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {output || "Run code to see output"}
      </pre>
    </div>
  );
};

export default OutputBox;