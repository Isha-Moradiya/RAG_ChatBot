"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

const CopyButton = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 z-10 text-xs bg-[#444649] hover:bg-[#5f6368] text-gray-300 px-2 py-1 rounded transition-all"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

const ChatResponse = ({ content }: { content: string }) => {
  return (
    <div className="text-sm leading-relaxed space-y-3 text-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold mt-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold mt-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium mt-2">{children}</h3>,
          p: ({ children }) => <p className="mt-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
          li: ({ children }) => <li className="ml-4">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-500 pl-4 italic text-gray-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mt-3">
              <table className="w-full border border-gray-700 text-left text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-600 bg-[#3c4043] px-3 py-2 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-700 px-3 py-2">{children}</td>
          ),
          img: ({ src = "", alt = "" }) => (
            <img
              src={src}
              alt={alt}
              className="rounded max-w-full h-auto mx-auto my-3 border border-gray-600"
            />
          ),

          pre: ({ children }) => {
            // Extract code string from child
            const code = String(children).replace(/\n$/, "");
            return (
              <div className="relative bg-[#1e1e1e] rounded my-3 overflow-hidden">
                <CopyButton code={code} />
                <pre className="overflow-x-auto hide-scrollbar text-sm p-4 text-gray-100">
                  {children}
                </pre>
              </div>
            );
          },

          code: ({ className = "", children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="bg-[#444649] px-1 py-0.5 rounded text-gray-200 font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={`language-${className.replace("language-", "")}`} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ChatResponse;
