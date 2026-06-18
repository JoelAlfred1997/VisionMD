import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { codeToHtml } from "shiki";
import mermaid from "mermaid";

/**
 * Renders untrusted Markdown into a safe, themed document.
 *
 * Pipeline: GFM + frontmatter parsing, raw HTML expanded then *sanitized*
 * (scripts / event handlers / dangerous URLs neutralized), then heading slugs,
 * anchor links, and GFM callout decoration. Slug/autolink/callouts run after
 * sanitize so their trusted ids/anchors/classes survive.
 *
 * Fenced code is syntax-highlighted with Shiki and ` ```mermaid ` blocks are
 * rendered as diagrams — both in client components fed escaped source, so they
 * never reintroduce an injection path.
 */

// Allow the className hooks our styling (and Shiki syntax highlighting) needs,
// on top of the conservative default sanitization schema.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "id", "className"],
  },
};

/** Known GFM callout kinds → display label. */
const CALLOUT_LABELS: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

/**
 * Decorate GFM callout blockquotes (`> [!NOTE]` …). Runs after sanitize so the
 * injected title node and class names are trusted. Detects the `[!TYPE]` marker
 * on the first line of a blockquote, strips it, tags the blockquote with
 * `callout callout-<type>`, and prepends a `.callout-title` row.
 */
function rehypeCallouts() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (node: any) => {
    if (!node || !Array.isArray(node.children)) return;
    for (const child of node.children) {
      if (child.type === "element" && child.tagName === "blockquote") {
        applyCallout(child);
      }
      walk(child);
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => walk(tree);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCallout(bq: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstP = bq.children.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => c.type === "element" && c.tagName === "p"
  );
  const firstText = firstP?.children?.[0];
  if (!firstText || firstText.type !== "text") return;

  const match = /^\[!(\w+)\]([^\n]*)(?:\n)?/.exec(firstText.value);
  if (!match) return;
  const type = match[1].toLowerCase();
  const label = CALLOUT_LABELS[type];
  if (!label) return;

  const customTitle = match[2].trim();
  firstText.value = firstText.value.slice(match[0].length);
  if (firstText.value === "") firstP.children.shift();

  bq.properties = { ...bq.properties, className: ["callout", `callout-${type}`] };
  bq.children.unshift({
    type: "element",
    tagName: "div",
    properties: { className: ["callout-title"] },
    children: [{ type: "text", value: customTitle || label }],
  });
}

const remarkPlugins = [remarkGfm, remarkFrontmatter];
const rehypePlugins = [
  rehypeRaw,
  [rehypeSanitize, sanitizeSchema],
  rehypeCallouts,
  rehypeSlug,
  [
    rehypeAutolinkHeadings,
    { behavior: "wrap", properties: { className: "heading-anchor" } },
  ],
] as const;

/** Theme awareness for client-rendered blocks (Mermaid bakes colors into SVG). */
const MarkdownThemeContext = createContext<{ isDark: boolean }>({
  isDark: false,
});

/** Flatten React children of a `code` node to its raw source text. */
function nodeText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(nodeText).join("");
  return "";
}

/** Shiki highlight with dual light/dark themes; CSS picks which to paint. */
async function highlight(code: string, lang: string): Promise<string> {
  const opts = {
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false as const,
  };
  try {
    return await codeToHtml(code, { lang, ...opts });
  } catch {
    // Unknown / unsupported language → render as plain text, still themed.
    return await codeToHtml(code, { lang: "text", ...opts });
  }
}

/** A syntax-highlighted fenced code block. */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    highlight(code, lang)
      .then((h) => {
        if (!cancelled) setHtml(h);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (html) {
    return (
      <div className="code-block" dangerouslySetInnerHTML={{ __html: html }} />
    );
  }
  // Pre-highlight (or failure) fallback: plain, but styled like a code block.
  return (
    <pre className="code-fallback">
      <code>{code}</code>
    </pre>
  );
}

/** A rendered Mermaid diagram (re-renders on theme change). */
function Mermaid({ code }: { code: string }) {
  const { isDark } = useContext(MarkdownThemeContext);
  const [state, setState] = useState<{ svg?: string; error?: string }>({});
  const idRef = useRef(`vmd-mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: isDark ? "dark" : "default",
      fontFamily: "inherit",
    });
    mermaid
      .render(idRef.current, code)
      .then(({ svg }) => {
        if (!cancelled) setState({ svg });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            error: err instanceof Error ? err.message : "Invalid diagram.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, isDark]);

  if (state.error) {
    return (
      <div className="mermaid-error">
        <p>Couldn&rsquo;t render this diagram.</p>
        <pre className="code-fallback">
          <code>{code}</code>
        </pre>
      </div>
    );
  }
  if (!state.svg) {
    return <div className="mermaid-loading">Rendering diagram…</div>;
  }
  return (
    <div
      className="mermaid-diagram"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}

const components: Components = {
  // Open external links in a new tab without leaking the opener.
  a({ href, children, ...props }) {
    const isExternal = !!href && /^(https?:)?\/\//i.test(href);
    return (
      <a
        href={href}
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...props}
      >
        {children}
      </a>
    );
  },
  // Let the code renderer own block layout (Shiki/Mermaid emit their own <pre>).
  pre({ children }) {
    return <>{children}</>;
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code({ className, children, node, ...rest }: any) {
    const text = nodeText(children);
    const lang = /language-([\w-]+)/.exec(className || "")?.[1];
    const isBlock = !!lang || text.includes("\n");

    if (!isBlock) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    const source = text.replace(/\n$/, "");
    if (lang === "mermaid") return <Mermaid code={source} />;
    return <CodeBlock code={source} lang={lang ?? "text"} />;
  },
};

/** Strip a leading YAML/TOML frontmatter block for separate display. */
function splitFrontmatter(source: string): {
  frontmatter: string | null;
  body: string;
} {
  const match = source.match(/^(---|\+\+\+)\r?\n([\s\S]*?)\r?\n\1\r?\n?/);
  if (!match) return { frontmatter: null, body: source };
  return { frontmatter: match[2].trim(), body: source.slice(match[0].length) };
}

interface MarkdownViewerProps {
  content: string;
  isDark?: boolean;
  /** Attached to the scroll container so export can read the rendered markup. */
  contentRef?: Ref<HTMLDivElement>;
}

export function MarkdownViewer({
  content,
  isDark = false,
  contentRef,
}: MarkdownViewerProps) {
  const { frontmatter, body } = useMemo(
    () => splitFrontmatter(content),
    [content]
  );

  const rendered = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rehypePlugins={rehypePlugins as any}
        components={components}
      >
        {body}
      </ReactMarkdown>
    ),
    [body]
  );

  const themeValue = useMemo(() => ({ isDark }), [isDark]);

  return (
    <div className="scrollable markdown-scroll" ref={contentRef}>
      {frontmatter && (
        <div className="markdown-frontmatter">{frontmatter}</div>
      )}
      <article className="markdown-body">
        <MarkdownThemeContext.Provider value={themeValue}>
          {rendered}
        </MarkdownThemeContext.Provider>
      </article>
    </div>
  );
}
