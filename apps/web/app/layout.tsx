import { RootProvider } from "fumadocs-ui/provider";
import "./globals.css";
import { Inter } from "next/font/google";
import { createMetadata } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"] });

export const metadata = createMetadata({
  title: {
    absolute: "Fuma Content",
    template: "Fuma Content - %s",
  },
  description: "The library that handles content",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
