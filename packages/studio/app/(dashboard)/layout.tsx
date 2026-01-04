import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { StudioPrefetchBoundary } from "@/lib/data/boundary";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <StudioPrefetchBoundary>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
          <Toaster />
        </SidebarInset>
      </SidebarProvider>
    </StudioPrefetchBoundary>
  );
}
