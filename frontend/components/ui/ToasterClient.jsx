"use client";

import { Toaster } from "sonner";

export default function ToasterClient() {
  return (
    <Toaster
      position="right"
      duration={5000}
      richColors
      closeButton
      offset={20}
    />
  );
}
