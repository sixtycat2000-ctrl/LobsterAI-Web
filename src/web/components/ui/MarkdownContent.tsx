import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const CodeBlock: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  const match = /language-([\w-]+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeText = String(children).replace(/\n$/, '');

  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border dark:border-claude-darkBorder border-claude-border relative shadow-subtle">
      <div className="dark:bg-claude-darkSurfaceMuted bg-claude-surfaceMuted px-4 py-2 text-xs dark:text-claude-darkTextSecondary text-claude-textSecondary font-medium flex items-center justify-between">
        <span>{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded-md dark:hover:bg-claude-darkSurfaceHover hover:bg-claude-surfaceHover transition-colors"
        >
          {isCopied ? (
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      <pre className="!m-0 !p-4 !bg-[#282c34] !text-[13px] leading-6 overflow-x-auto">
        <code className={`language-${language || 'text'}`}>{codeText}</code>
      </pre>
    </div>
  );
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const components = useMemo(
    () => ({
      p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="my-1 first:mt-0 last:mb-0 leading-6 dark:text-claude-darkText text-claude-text">
          {children}
        </p>
      ),
      strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold dark:text-claude-darkText text-claude-text">{children}</strong>
      ),
      h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1 className="text-2xl font-semibold mt-6 mb-3 dark:text-claude-darkText text-claude-text">
          {children}
        </h1>
      ),
      h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className="text-xl font-semibold mt-5 mb-2 dark:text-claude-darkText text-claude-text">
          {children}
        </h2>
      ),
      h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="text-lg font-semibold mt-4 mb-2 dark:text-claude-darkText text-claude-text">
          {children}
        </h3>
      ),
      ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="list-disc pl-5 my-1.5 dark:text-claude-darkText text-claude-text">{children}</ul>
      ),
      ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className="list-decimal pl-6 my-1.5 dark:text-claude-darkText text-claude-text">{children}</ol>
      ),
      li: ({ children }: React.HTMLAttributes<HTMLLIElement>) => (
        <li className="my-0.5 leading-6 dark:text-claude-darkText text-claude-text">{children}</li>
      ),
      blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote className="border-l-4 border-claude-accent pl-4 py-1 my-2 dark:bg-claude-darkSurface/30 bg-claude-surfaceHover/30 rounded-r-lg dark:text-claude-darkText text-claude-text">
          {children}
        </blockquote>
      ),
      code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
        const isInline = !className || !className.includes('language-');
        if (isInline) {
          return (
            <code
              className="inline bg-transparent px-0.5 text-[0.92em] font-mono font-medium dark:text-claude-darkText text-claude-text"
              {...props}
            >
              {children}
            </code>
          );
        }
        return <CodeBlock className={className}>{children}</CodeBlock>;
      },
      a: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-claude-accent hover:text-claude-accentHover underline decoration-claude-accent/50 hover:decoration-claude-accent transition-colors"
        >
          {children}
        </a>
      ),
      img: ({ src, alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
        <img src={src} alt={alt} className="max-w-full h-auto rounded-xl my-4" />
      ),
    }),
    []
  );

  return (
    <div className={`markdown-content text-[15px] leading-6 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
