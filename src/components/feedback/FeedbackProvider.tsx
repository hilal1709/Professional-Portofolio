"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "./modal";
import { ToastProvider } from "./toast";

export function FeedbackProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
