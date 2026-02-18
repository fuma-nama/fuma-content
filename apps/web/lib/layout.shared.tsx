import { Logo } from "@/components/logo";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const gitConfig = {
  owner: "fuma-nama",
  repo: "fuma-content",
  branch: "main",
};

export function baseOptions({ links, ...rest }: BaseLayoutProps = {}): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo className="size-6" />
          Fuma Content
        </>
      ),
    },
    links: links ?? [
      {
        type: "main",
        url: "/docs",
        text: "Documentation",
      },
    ],
    githubUrl: `https://github.com/${gitConfig.owner}/${gitConfig.repo}`,
    ...rest,
  };
}
