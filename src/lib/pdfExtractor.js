import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure worker for browser environment
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Extracts plain text from a File or Blob containing a PDF entirely in the browser.
 * Never sends the raw file to any server.
 */
export async function extractPdfText(file) {
  if (!file) throw new Error('No PDF file provided');
  
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  const numPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageStrings = content.items
      .map(item => ('str' in item ? item.str : ''))
      .filter(Boolean);
    
    if (pageStrings.length > 0) {
      fullText += `[Page ${pageNum}]\n` + pageStrings.join(' ') + '\n\n';
    }
  }

  const cleaned = fullText.trim();
  if (!cleaned) {
    throw new Error('No readable text could be extracted from this PDF.');
  }

  return cleaned;
}
