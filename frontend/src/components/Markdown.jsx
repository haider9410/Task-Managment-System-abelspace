"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components = {
  p: ({ children }) => (
    <p className="my-1.5 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-50">
      {children}
    </strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="my-1.5 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1.5 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ inline, className, children }) =>
    inline ? (
      <code className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-[0.85em] text-violet-700 dark:text-violet-300">
        {children}
      </code>
    ) : (
      <code
        className={`block overflow-x-auto rounded-lg bg-gray-100 dark:bg-gray-800 p-2.5 text-xs leading-relaxed ${className || ""}`}
      >
        {children}
      </code>
    ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full min-w-[420px] border-collapse text-left text-xs">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 dark:bg-gray-800/80">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold text-gray-700 dark:text-gray-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-gray-100 dark:border-gray-800 px-3 py-2 align-top whitespace-nowrap text-gray-600 dark:text-gray-300">
      {children}
    </td>
  ),
  h1: ({ children }) => (
    <h1 className="my-2 text-base font-semibold text-gray-900 dark:text-gray-50">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="my-2 text-sm font-semibold text-gray-900 dark:text-gray-50">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="my-2 text-sm font-semibold text-gray-900 dark:text-gray-50">
      {children}
    </h3>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-600 dark:text-violet-400 underline underline-offset-2"
    >
      {children}
    </a>
  ),
};

export default function Markdown({ children }) {
  return (
    <div className="text-sm text-gray-700 dark:text-gray-200">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}