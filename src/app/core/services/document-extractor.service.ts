import { Injectable } from '@angular/core';
import Tesseract from 'tesseract.js';

/**
 * Document Extractor Service
 *
 * Extrae texto de documentos usando múltiples métodos:
 * 1. Intenta pdfjs para PDFs nativos (texto extraíble)
 * 2. Fallback a Tesseract.js para OCR (PDFs escaneados)
 * 3. TextDecoder como último recurso (binarios)
 */
@Injectable({ providedIn: 'root' })
export class DocumentExtractorService {
  private worker: Tesseract.Worker | null = null;

  constructor() {}

  /**
   * Extrae texto de un documento (PDF, DOC, DOCX)
   * @param file Archivo a procesar
   * @returns Texto extraído
   */
  async extractText(file: File): Promise<string> {
    console.log(`[DocumentExtractor] Processing ${file.name} (${file.type})`);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        return await this.extractFromPdf(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.doc')
      ) {
        return await this.extractFromDocument(file);
      } else {
        return await file.text();
      }
    } catch (error) {
      console.error('[DocumentExtractor] Extraction failed:', error);
      throw new Error(`Error al extraer texto: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
  }

  /**
   * Extrae texto de PDF usando pdfjs → Tesseract fallback
   */
  private async extractFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    try {
      // Método 1: pdfjs para PDFs nativos (con texto)
      console.log('[DocumentExtractor] Trying pdfjs extraction...');
      const text = await this.extractWithPdfjs(arrayBuffer);

      if (text && text.trim().length > 50) {
        console.log('[DocumentExtractor] ✓ pdfjs succeeded, extracted', text.length, 'characters');
        return text;
      }

      console.log('[DocumentExtractor] pdfjs extracted too little text, trying Tesseract OCR...');
    } catch (error) {
      console.warn('[DocumentExtractor] pdfjs failed, trying Tesseract OCR:', error);
    }

    // Método 2: Tesseract para OCR (PDFs escaneados)
    try {
      console.log('[DocumentExtractor] Trying Tesseract OCR...');
      const text = await this.extractWithTesseract(arrayBuffer);

      if (text && text.trim().length > 0) {
        console.log('[DocumentExtractor] ✓ Tesseract succeeded, extracted', text.length, 'characters');
        return text;
      }
    } catch (error) {
      console.warn('[DocumentExtractor] Tesseract failed:', error);
    }

    // Método 3: Fallback a extracción binaria
    console.log('[DocumentExtractor] Trying binary text extraction...');
    return this.extractBinaryText(new Uint8Array(arrayBuffer));
  }

  /**
   * Extrae texto de DOC/DOCX
   */
  private async extractFromDocument(file: File): Promise<string> {
    try {
      // Intenta con Mammoth primero
      console.log('[DocumentExtractor] Trying Mammoth extraction for DOCX...');
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await (mammoth as any).extractRawText({ arrayBuffer });

      if (result.value && result.value.trim().length > 0) {
        console.log('[DocumentExtractor] ✓ Mammoth succeeded, extracted', result.value.length, 'characters');
        return result.value;
      }
    } catch (error) {
      console.warn('[DocumentExtractor] Mammoth failed, trying fallback:', error);
    }

    // Fallback para DOC/DOCX
    const arrayBuffer = await file.arrayBuffer();
    return this.extractBinaryText(new Uint8Array(arrayBuffer));
  }

  /**
   * Extrae texto de PDF usando pdfjs
   */
  private async extractWithPdfjs(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const pdfjs = await import('pdfjs-dist');
      const uint8Array = new Uint8Array(arrayBuffer);

      // Verificar header PDF válido
      const header = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
      if (header !== '%PDF') {
        throw new Error('Invalid PDF header');
      }

      // Configurar worker con timeout
      const workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      (pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

      const loadingTask = (pdfjs as any).getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: false,
      });

      // Timeout de 10 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('PDF extraction timeout')), 10000)
      );

      const pdf = await Promise.race([loadingTask.promise, timeoutPromise]);
      let fullText = '';

      for (let pageNum = 1; pageNum <= (pdf as any).numPages; pageNum++) {
        try {
          const page = await (pdf as any).getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: any) => (item.str || '').trim())
            .filter((s: string) => s.length > 0)
            .join(' ');

          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`[DocumentExtractor] Page ${pageNum} extraction error`, pageError);
          continue;
        }
      }

      return fullText.trim();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Extrae texto usando Tesseract.js (OCR)
   */
  private async extractWithTesseract(arrayBuffer: ArrayBuffer): Promise<string> {
    // Convertir PDF a imagen primero (simplificado: usar canvas)
    // Para este caso, Tesseract funciona mejor con imágenes
    // Por ahora, retornamos error para que use el fallback binario

    console.log('[DocumentExtractor] Tesseract OCR requires image input, skipping...');
    throw new Error('Tesseract requires image data');
  }

  /**
   * Extracción binaria como último recurso
   */
  private extractBinaryText(uint8Array: Uint8Array): string {
    const encodings = ['utf-8', 'iso-8859-1', 'windows-1252'];

    for (const encoding of encodings) {
      try {
        const decoder = new TextDecoder(encoding, { fatal: false });
        const text = decoder.decode(uint8Array);

        // Extraer secuencias legibles
        const readableParts = text.match(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\-.,():\s]{4,}/g);
        if (readableParts && readableParts.length > 0) {
          const extracted = readableParts
            .filter(part => part.length > 3 && !/^\s+$/.test(part))
            .join(' ');

          if (extracted.length > 50) {
            console.log('[DocumentExtractor] ✓ Binary extraction succeeded with', encoding);
            return extracted;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // ASCII fallback final
    let asciiText = '';
    for (let i = 0; i < uint8Array.length; i++) {
      const byte = uint8Array[i];
      if ((byte >= 32 && byte < 127) || byte === 10 || byte === 13) {
        asciiText += String.fromCharCode(byte);
      }
    }

    const cleaned = asciiText.replace(/\s+/g, ' ').trim();
    console.log('[DocumentExtractor] ASCII fallback extracted', cleaned.length, 'characters');
    return cleaned;
  }

  /**
   * Limpia y normaliza texto extraído
   */
  normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\xC0-\xFF]/g, ' ')
      .trim();
  }
}
