import type { Processor, Transformer } from "unified";
import { visit } from "unist-util-visit";
import type { Code, Node, Root, RootContent } from "mdast";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import { fumaMatter } from "@/collections/mdx/fuma-matter";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";
import { VFile } from "vfile";
import type { Directives } from "mdast-util-directive";
import { flattenNode } from "@/utils/mdast/flatten";

export interface Params {
  lang?: string;
  meta?: string;
}

const ElementLikeTypes: ElementLikeContent["type"][] = [
  "mdxJsxFlowElement",
  "mdxJsxTextElement",
  "containerDirective",
  "textDirective",
  "leafDirective",
];
type ElementLikeContent = MdxJsxFlowElement | MdxJsxTextElement | Directives;

function isElementLike(node: Node): node is ElementLikeContent {
  return ElementLikeTypes.includes(node.type as ElementLikeContent["type"]);
}

function parseElementAttributes(
  element: ElementLikeContent,
): Record<string, string | null | undefined> {
  if (Array.isArray(element.attributes)) {
    const attributes: Record<string, string | null> = {};

    for (const attr of element.attributes) {
      if (
        attr.type === "mdxJsxAttribute" &&
        (typeof attr.value === "string" || attr.value === null)
      ) {
        attributes[attr.name] = attr.value;
      }
    }

    return attributes;
  }

  return element.attributes ?? {};
}

function parseSpecifier(specifier: string): {
  file: string;
  section?: string;
} {
  const idx = specifier.lastIndexOf("#");
  if (idx === -1) return { file: specifier };

  return {
    file: specifier.slice(0, idx),
    section: specifier.slice(idx + 1),
  };
}

function extractSection(root: Root, section: string): Root | undefined {
  let nodes: RootContent[] | undefined;
  let capturingHeadingContent = false;

  visit(root, (node) => {
    if (node.type === "heading") {
      if (capturingHeadingContent) {
        return false;
      }

      if (node.data?.hProperties?.id === section) {
        capturingHeadingContent = true;
        nodes = [node];
        return "skip";
      }

      return;
    }

    if (capturingHeadingContent) {
      nodes?.push(node as RootContent);
      return "skip";
    }

    if (isElementLike(node) && node.name === "section") {
      const attributes = parseElementAttributes(node);

      if (attributes.id === section) {
        nodes = node.children;
        return false;
      }
    }
  });

  if (nodes)
    return {
      type: "root",
      children: nodes,
    };
}

// region marker regexes
const REGION_MARKERS = [
  {
    start: /^\s*\/\/\s*#?region\b\s*(.*?)\s*$/,
    end: /^\s*\/\/\s*#?endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*<!--\s*#?region\b\s*(.*?)\s*-->/,
    end: /^\s*<!--\s*#?endregion\b\s*(.*?)\s*-->/,
  },
  {
    start: /^\s*\/\*\s*#region\b\s*(.*?)\s*\*\//,
    end: /^\s*\/\*\s*#endregion\b\s*(.*?)\s*\*\//,
  },
  {
    start: /^\s*#[rR]egion\b\s*(.*?)\s*$/,
    end: /^\s*#[eE]nd ?[rR]egion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*#\s*#?region\b\s*(.*?)\s*$/,
    end: /^\s*#\s*#?endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*(?:--|::|@?REM)\s*#region\b\s*(.*?)\s*$/,
    end: /^\s*(?:--|::|@?REM)\s*#endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*#pragma\s+region\b\s*(.*?)\s*$/,
    end: /^\s*#pragma\s+endregion\b\s*(.*?)\s*$/,
  },
  {
    start: /^\s*\(\*\s*#region\b\s*(.*?)\s*\*\)/,
    end: /^\s*\(\*\s*#endregion\b\s*(.*?)\s*\*\)/,
  },
];

function dedent(lines: string[]): string {
  const minIndent = lines.reduce((min, line) => {
    const match = line.match(/^(\s*)\S/);
    return match ? Math.min(min, match[1].length) : min;
  }, Infinity);

  return minIndent === Infinity
    ? lines.join("\n")
    : lines.map((l) => l.slice(minIndent)).join("\n");
}

function extractCodeRegion(content: string, regionName: string): string {
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    for (const re of REGION_MARKERS) {
      let match = re.start.exec(lines[i]);
      if (match?.[1] !== regionName) continue;

      let depth = 1;
      const extractedLines: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        match = re.start.exec(lines[j]);
        if (match) {
          depth++;
          continue;
        }

        match = re.end.exec(lines[j]);
        if (match) {
          if (match[1] === regionName) depth = 0;
          else if (match[1] === "") depth--;
          else continue;

          if (depth > 0) continue;
          return dedent(extractedLines);
        } else {
          extractedLines.push(lines[j]);
        }
      }
    }
  }
  throw new Error(`Region "${regionName}" not found`);
}

export interface RemarkIncludeOptions {
  tagName?: string;
}

declare module "vfile" {
  interface DataMap {
    /** [Fuma Content: remark-include] whether the content is getting parsed from a `<include />` */
    _in_include?: boolean;
  }
}

export function remarkInclude(
  this: Processor,
  { tagName = "include" }: RemarkIncludeOptions = {},
): Transformer<Root, Root> {
  const embedContent = async (
    targetPath: string,
    heading: string | undefined,
    params: Params,
    parent: VFile,
  ) => {
    const { _getProcessor = () => this, _compiler } = parent.data;
    let content: string;
    try {
      content = (await fs.readFile(targetPath)).toString();
    } catch (e) {
      throw new Error(
        `failed to read file ${targetPath}\n${e instanceof Error ? e.message : String(e)}`,
        { cause: e },
      );
    }

    const ext = path.extname(targetPath);
    _compiler?.addDependency(targetPath);
    if (params.lang || (ext !== ".md" && ext !== ".mdx")) {
      const lang = params.lang ?? ext.slice(1);

      return {
        type: "code",
        lang,
        meta: params.meta,
        value: heading ? extractCodeRegion(content, heading) : content,
        data: {},
      } satisfies Code;
    }

    const processor = (await _getProcessor(ext === ".mdx" ? "mdx" : "md")) as unknown as Processor<
      Root,
      Root,
      Root
    >;
    const parsed = fumaMatter(content);
    const targetFile = new VFile({
      path: targetPath,
      value: parsed.content,
      data: {
        ...parent.data,
        frontmatter: parsed.data as Record<string, unknown>,
        _in_include: true,
      },
    });

    let mdast: Root;
    try {
      mdast = await processor.run(processor.parse(targetFile), targetFile);
    } catch (e) {
      if (e instanceof Terminated) mdast = e.value;
      else throw e;
    }

    if (heading) {
      const extracted = extractSection(mdast, heading);
      if (!extracted)
        throw new Error(
          `Cannot find section ${heading} in ${targetPath}, make sure you have encapsulated the section in a <section id="${heading}"> tag, or a :::section directive with remark-directive configured.`,
        );

      mdast = extracted;
    }

    await update(mdast, targetFile);
    return mdast;
  };

  async function update(tree: Root, file: VFile) {
    const queue: Promise<void>[] = [];

    visit(tree, ElementLikeTypes, (_node, _, parent) => {
      const node = _node as ElementLikeContent;
      if (node.name !== tagName) return;

      const specifier = flattenNode(node);
      if (specifier.length === 0) return "skip";

      const attributes = parseElementAttributes(node);
      const { file: relativePath, section } = parseSpecifier(specifier);
      const targetPath = path.resolve(
        "cwd" in attributes ? file.cwd : (file.dirname ?? ""),
        relativePath,
      );

      queue.push(
        embedContent(targetPath, section, attributes, file).then((replace) => {
          Object.assign(parent && parent.type === "paragraph" ? parent : node, replace);
        }),
      );

      return "skip";
    });

    await Promise.all(queue);
  }
  return async (tree, file) => {
    if (file.data._in_include) throw new Terminated(tree);

    await update(tree, file);
  };
}

class Terminated {
  constructor(readonly value: Root) {}
}
