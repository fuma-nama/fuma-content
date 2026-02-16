import type { Root, RootContent } from "mdast";
import { separate } from "../../utils/mdast/separate";

const RegexDelimiter = /(?<!\\)%%/;

export function removeComment(tree: Root) {
  function remove(nodes: RootContent[]): RootContent[] {
    const start = separate(RegexDelimiter, nodes);
    if (!start) return nodes;
    const [before, rest] = start;

    const end = separate(RegexDelimiter, rest);
    if (!end) return nodes;

    return [...before, ...remove(end[1])];
  }

  tree.children = remove(tree.children);
  return tree;
}
