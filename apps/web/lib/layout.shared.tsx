import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions({
  links,
  ...rest
}: BaseLayoutProps = {}): BaseLayoutProps {
  return {
    nav: {
      title: "Fuma Content",
    },
    links: links ?? [
      {
        type: "main",
        url: "/docs",
        text: "Documentation",
      },
    ],
    ...rest,
  };
}
