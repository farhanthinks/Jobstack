export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  try {
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.endsWith(".docx")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    if (
      mimeType === "text/plain" ||
      mimeType === "text/x-tex" ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".tex")
    ) {
      return buffer.toString("utf-8").trim();
    }

    // application/msword (legacy .doc) has no reliable pure-JS parser —
    // AI features will fall back to asking the user to re-upload as PDF/DOCX.
    return null;
  } catch {
    return null;
  }
}
