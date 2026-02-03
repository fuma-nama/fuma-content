"use client";

import { PlaceholderPlugin } from "@platejs/media/react";
import { ImageIcon, LinkIcon } from "lucide-react";
import { isUrl, KEYS } from "platejs";
import { useEditorRef } from "platejs/react";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from "../../ui/toolbar";

export function MediaToolbarButton(props: React.ComponentProps<typeof DropdownMenu>) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const inputId = React.useId();

  return (
    <>
      <ToolbarSplitButton
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        pressed={open}
      >
        <label htmlFor={inputId}>
          <ToolbarSplitButtonPrimary>
            <ImageIcon className="size-4" />
          </ToolbarSplitButtonPrimary>
        </label>
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
          <DropdownMenuTrigger asChild>
            <ToolbarSplitButtonSecondary />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            onClick={(e) => e.stopPropagation()}
            align="start"
            alignOffset={-32}
            className="min-w-54"
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild>
              <label htmlFor={inputId}>
                <ImageIcon className="size-4" />
                Upload from computer
              </label>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
              <LinkIcon />
              Insert via URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ToolbarSplitButton>
      <input
        id={inputId}
        type="file"
        hidden
        multiple
        accept="video/*, image/*"
        onChange={(e) => {
          const files = e.target.files;
          if (!files) return;

          editor.getTransforms(PlaceholderPlugin).insert.media(files);
          setOpen(false);
        }}
      />

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent setOpen={setDialogOpen} />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({ setOpen }: { setOpen: (value: boolean) => void }) {
  const editor = useEditorRef();
  const [url, setUrl] = React.useState("");

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error("Invalid URL");
    const parsed = new URL(url);
    const mediaType = getMediaTypeFromExtension(parsed);

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: "" }],
      name: parsed.pathname,
      type: mediaType?.startsWith("video/")
        ? KEYS.video
        : mediaType?.startsWith("image/")
          ? KEYS.img
          : KEYS.file,
      url,
    });
  }, [url, editor, setOpen]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Insert Image & Video</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          Accept
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

function getMediaTypeFromExtension(url: URL) {
  const idx = url.pathname.lastIndexOf(".");
  if (idx === -1) return;
  const extension = url.pathname.slice(idx + 1);

  // A basic mapping of common extensions to MIME types
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    pdf: "application/pdf",
    json: "application/json",
  };

  return mimeTypes[extension];
}
