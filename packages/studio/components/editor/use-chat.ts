"use client";

import { type UseChatHelpers, useChat as useBaseChat } from "@ai-sdk/react";
import { AIChatPlugin, aiCommentToRange } from "@platejs/ai/react";
import { getCommentKey, getTransientCommentKey } from "@platejs/comment";
import { deserializeMd } from "@platejs/markdown";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { KEYS, NodeApi, nanoid, TextApi, type TNode } from "platejs";
import { useEditorRef, usePluginOption } from "platejs/react";
import * as React from "react";

import { aiChatPlugin } from "@/components/editor/plugins/ai-kit";

import { discussionPlugin } from "./plugins/discussion-kit";

export type ToolName = "comment" | "edit" | "generate";

export type TComment = {
  comment: {
    blockId: string;
    comment: string;
    content: string;
  } | null;
  status: "finished" | "streaming";
};

export type MessageDataPart = {
  toolName: ToolName;
  comment?: TComment;
};

export type Chat = UseChatHelpers<ChatMessage>;

export type ChatMessage = UIMessage<unknown, MessageDataPart>;

export const useChat = () => {
  const editor = useEditorRef();
  const options = usePluginOption(aiChatPlugin, "chatOptions");

  // remove when you implement the route /api/ai/command
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const _abortFakeStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const baseChat = useBaseChat<ChatMessage>({
    id: "editor",
    transport: new DefaultChatTransport({
      api: options.api || "/api/ai/command",
    }),
    onData(data) {
      if (data.type === "data-toolName") {
        editor.setOption(AIChatPlugin, "toolName", data.data);
      }

      if (data.type === "data-comment" && data.data) {
        if (data.data.status === "finished") {
          editor.getApi(BlockSelectionPlugin).blockSelection.deselect();

          return;
        }

        const aiComment = data.data.comment!;
        const range = aiCommentToRange(editor, aiComment);

        if (!range) return console.warn("No range found for AI comment");

        const discussions = editor.getOption(discussionPlugin, "discussions") || [];

        // Generate a new discussion ID
        const discussionId = nanoid();

        // Create a new comment
        const newComment = {
          id: nanoid(),
          contentRich: [{ children: [{ text: aiComment.comment }], type: "p" }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, "currentUserId"),
        };

        // Create a new discussion
        const newDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor, aiComment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join("\n"),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, "currentUserId"),
        };

        // Update discussions
        const updatedDiscussions = [...discussions, newDiscussion];
        editor.setOption(discussionPlugin, "discussions", updatedDiscussions);

        // Apply comment marks to the editor
        editor.tf.withMerging(() => {
          editor.tf.setNodes(
            {
              [getCommentKey(newDiscussion.id)]: true,
              [getTransientCommentKey()]: true,
              [KEYS.comment]: true,
            },
            {
              at: range,
              match: TextApi.isText,
              split: true,
            },
          );
        });
      }
    },

    ...options,
  });

  const chat = {
    ...baseChat,
    _abortFakeStream,
  };

  React.useEffect(() => {
    editor.setOption(AIChatPlugin, "chat", chat as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.status, chat.messages, chat.error]);

  return chat;
};
