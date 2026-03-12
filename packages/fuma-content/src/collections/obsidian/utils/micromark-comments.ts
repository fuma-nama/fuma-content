import type { Extension, State, TokenizeContext, Tokenizer, Code } from "micromark-util-types";
import type { Literal } from "mdast";

export interface PercentComment extends Literal {
  type: "percentComment";
  value: string;
}

declare module "micromark-util-types" {
  interface TokenTypeMap {
    percentComment: "percentComment";
    percentCommentMarker: "percentCommentMarker";
  }
}

declare module "mdast" {
  interface RootContentMap {
    percentComment: PercentComment;
  }

  interface PhrasingContentMap {
    percentComment: PercentComment;
  }
}

export function percentCommentMicromark(): Extension {
  return {
    text: {
      [37]: { tokenize: tokenizePercentComment }, // %
    },
  };
}

const tokenizePercentComment: Tokenizer = function (
  this: TokenizeContext,
  effects,
  ok,
  nok,
): State {
  let seenClosing = 0;

  const start: State = (code: Code) => {
    // opening %%
    if (code !== 37) return nok(code);
    if (this.previous === 92) return nok(code); // \%%
    effects.enter("percentComment");
    effects.enter("percentCommentMarker");
    effects.consume(code);
    return openSecondPercent;
  };

  function openSecondPercent(code: Code): State | undefined {
    if (code !== 37) return nok(code);
    effects.consume(code);
    effects.exit("percentCommentMarker");
    return inside;
  }

  function inside(code: Code): State | undefined {
    if (code === null) return nok(code);

    if (code === 37) {
      effects.enter("percentCommentMarker");
      effects.consume(code);
      seenClosing = 1;
      return closeSecondPercent;
    }

    effects.consume(code);
    return inside;
  }

  function closeSecondPercent(code: Code) {
    if (code === 37) {
      effects.consume(code);
      effects.exit("percentCommentMarker");
      effects.exit("percentComment");
      return ok;
    }

    // It was just a single %, continue comment body.
    effects.exit("percentCommentMarker");
    seenClosing = 0;
    return inside(code);
  }

  return start;
};

export function percentCommentFromMarkdown() {
  return {
    enter: {
      percentComment() {
        // Intentionally no-op: consume comment tokens but produce no mdast node.
      },
    },
    exit: {
      percentComment() {
        // Intentionally no-op.
      },
    },
  };
}
