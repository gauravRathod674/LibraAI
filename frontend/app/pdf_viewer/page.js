// app/pdf_viewer/page.js
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PdfViewerRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const defaultPdf = "ikigai.pdf";
    if (!pathname.endsWith(`/${defaultPdf}`)) {
      router.replace(`${pathname}/${defaultPdf}`);
    }
  }, [pathname, router]);

  return null; // You can show a loading spinner here if needed
}
