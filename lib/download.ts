// lib/download.ts
import { downloadFile } from "@/lib/api";

export async function downloadFileWithAuth(
  fileName: string,
  originalName: string
) {
  try {
    const blob = await downloadFile(fileName);

    // ✅ Create temporary download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = originalName; // ✅ Use original filename
    document.body.appendChild(link);
    link.click();

    // ✅ Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
    throw err;
  }
}
