import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/cn";

const geist = Geist({
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn(geist.className, geistMono.variable)} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
