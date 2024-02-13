import { DocsLayout } from "fumadocs-ui/layout";
import type { ReactNode } from "react";
import { pageTree } from "../source";
import { Logo } from "@/components/logo";

export default function RootDocsLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={pageTree}
      nav={{
        title: (
          <>
            <Logo className="size-5 mr-2" />
            Fuma Content
          </>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
