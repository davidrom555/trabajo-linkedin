import { Injectable } from '@angular/core';
import { UserProfile, Experience, Education } from '../models/profile.model';

@Injectable({ providedIn: 'root' })
export class CvParserService {

  /** Parse any supported CV file into a UserProfile */
  async parseFile(file: File): Promise<UserProfile> {
    let rawText: string;

    console.log('[CvParser] Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        rawText = await this.extractTextFromPdf(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 file.name.endsWith('.docx') ||
                 file.name.endsWith('.doc')) {
        rawText = await this.extractTextFromDoc(file);
      } else {
        rawText = await file.text();
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No text extracted from file');
      }

      console.log('[CvParser] ✓ Extracted text length:', rawText.length, 'characters');
      console.log('[CvParser] Preview (first 200 chars):', rawText.substring(0, 200));

      return this.parseText(rawText, file.name);

    } catch (error) {
      console.error('[CvParser] ✗ Error parsing file:', error);
      throw new Error(`Error al procesar CV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /** Extract text from PDF - using dynamic import */
  private async extractTextFromPdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Verify it's a valid PDF (starts with %PDF)
      const pdfHeader = String.fromCharCode(uint8Array[0], uint8Array[1], uint8Array[2], uint8Array[3]);
      if (pdfHeader !== '%PDF') {
        console.warn('[CvParser] Invalid PDF header, trying fallback');
        return this.fallbackPdfExtraction(file);
      }

      // Set worker source BEFORE importing
      const workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

      // Dynamic import to avoid issues
      const pdfjs = await import('pdfjs-dist');

      // Configure worker
      (pdfjs as any).GlobalWorkerOptions.workerSrc = workerSrc;

      const loadingTask = (pdfjs as any).getDocument({
        data: uint8Array,
        useSystemFonts: true,
        disableFontFace: false,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
      });

      const pdf = await loadingTask.promise;
      let fullText = '';

      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          const pageText = textContent.items
            .map((item: any) => (item.str || '').trim())
            .filter((s: string) => s.length > 0)
            .join(' ');

          fullText += pageText + '\n';
        } catch (pageError) {
          console.warn(`[CvParser] Error extracting page ${pageNum}:`, pageError);
          continue;
        }
      }

      if (fullText.trim().length === 0) {
        console.warn('[CvParser] PDF extracted but no text found, trying fallback');
        return this.fallbackPdfExtraction(file);
      }

      console.log('[CvParser] PDF text extracted, length:', fullText.length);
      return fullText;

    } catch (error) {
      console.error('[CvParser] PDF extraction failed:', error);
      return this.fallbackPdfExtraction(file);
    }
  }

  /** Fallback PDF extraction for scanned or corrupted PDFs */
  private async fallbackPdfExtraction(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try multiple encodings
      const encodings = ['utf-8', 'iso-8859-1', 'windows-1252'];
      let bestText = '';
      let bestScore = 0;

      for (const encoding of encodings) {
        try {
          const decoder = new TextDecoder(encoding, { fatal: false });
          const text = decoder.decode(uint8Array);

          // Extract readable sequences - improved pattern
          const readableParts = text.match(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\-.,():\s]{4,}/g);
          if (readableParts) {
            const extracted = readableParts
              .filter(part => part.length > 3 && !/^\s+$/.test(part))
              .join(' ');

            // Score based on length and content quality
            const score = extracted.length * (extracted.match(/[A-Za-z]/g)?.length || 0);
            if (score > bestScore) {
              bestScore = score;
              bestText = extracted;
            }
          }
        } catch (e) {
          // Continue to next encoding
        }
      }

      // Secondary fallback: extract printable ASCII
      if (bestText.length < 50) {
        let asciiText = '';
        let lastWasSpace = true;

        for (let i = 0; i < uint8Array.length; i++) {
          const byte = uint8Array[i];

          if ((byte >= 32 && byte < 127) || byte === 10 || byte === 13) {
            const char = String.fromCharCode(byte);
            if (char === '\n' || char === '\r') {
              if (!lastWasSpace) asciiText += ' ';
              lastWasSpace = true;
            } else if (char !== ' ') {
              asciiText += char;
              lastWasSpace = false;
            } else if (!lastWasSpace) {
              asciiText += ' ';
              lastWasSpace = true;
            }
          }
        }

        const sequences = asciiText.match(/[A-Za-z\d\s]{4,}/g);
        if (sequences && sequences.join(' ').length > bestText.length) {
          bestText = sequences.join(' ');
        }
      }

      console.log('[CvParser] PDF fallback extraction, length:', bestText.length);
      return bestText.trim();

    } catch (error) {
      console.error('[CvParser] PDF fallback extraction failed:', error);
      return '';
    }
  }

  /** Extract text from DOC/DOCX using Mammoth.js */
  private async extractTextFromDoc(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();

      const result = await (mammoth as any).extractRawText({ arrayBuffer });

      if (!result.value || result.value.trim().length === 0) {
        console.warn('[CvParser] Mammoth extracted empty text, trying fallback');
        return this.fallbackDocExtraction(file);
      }

      console.log('[CvParser] DOCX text extracted via Mammoth, length:', result.value.length);
      return result.value;

    } catch (error) {
      console.error('[CvParser] Mammoth extraction failed:', error);
      return this.fallbackDocExtraction(file);
    }
  }

  /** Fallback for DOC/DOCX extraction */
  private async fallbackDocExtraction(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Try to decode as text with different encodings
      const encodings = ['utf-8', 'utf-16', 'iso-8859-1', 'windows-1252'];
      let bestText = '';

      for (const encoding of encodings) {
        try {
          const decoder = new TextDecoder(encoding, { fatal: false });
          const text = decoder.decode(uint8Array);

          // Extract readable sequences (filter out binary junk)
          const readableParts = text.match(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-.,()]{4,}/g);
          if (readableParts) {
            const extracted = readableParts
              .filter(part => part.length > 3 && !/^\s+$/.test(part))
              .join(' ');

            if (extracted.length > bestText.length) {
              bestText = extracted;
            }
          }
        } catch (e) {
          // Continue to next encoding
        }
      }

      console.log('[CvParser] DOC fallback extraction, length:', bestText.length);
      return bestText;

    } catch (error) {
      console.error('[CvParser] DOC fallback extraction failed:', error);
      return '';
    }
  }

  /** Parse extracted text into a structured profile */
  private parseText(text: string, fileName: string): UserProfile {
    // Clean text first
    const cleanedText = this.cleanText(text);
    
    const skills = this.extractSkills(cleanedText);
    const name = this.extractName(cleanedText);
    const email = this.extractEmail(cleanedText);
    const phone = this.extractPhone(cleanedText);
    const location = this.extractLocation(cleanedText);
    const experience = this.extractExperience(cleanedText);
    const education = this.extractEducation(cleanedText);
    const languages = this.extractLanguages(cleanedText);
    const headline = this.inferHeadline(cleanedText, skills, experience);
    const summary = this.extractSummary(cleanedText);

    return {
      id: crypto.randomUUID(),
      fullName: name || 'Usuario',
      headline,
      summary: summary || `Profesional con experiencia en ${skills.slice(0, 5).join(', ')}.`,
      skills,
      experience,
      education,
      languages,
      location: location || '',
      cvFileName: fileName,
      cvUploadedAt: new Date(),
    };
  }

  /** Clean extracted text */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E\n\xC0-\xFF]/g, ' ') // Keep printable ASCII and extended Latin
      .trim();
  }

  // ── Skill Extraction ────────────────────────────────────

  private readonly SKILL_PATTERNS: Array<{ pattern: RegExp; skill: string }> = [
    { pattern: /\bJavaScript\b|\bJS\b/i, skill: 'JavaScript' },
    { pattern: /\bTypeScript\b|\bTS\b/i, skill: 'TypeScript' },
    { pattern: /\bPython\b/i, skill: 'Python' },
    { pattern: /\bJava\b(?!Script)/i, skill: 'Java' },
    { pattern: /\bC#\b|\.NET/i, skill: 'C#' },
    { pattern: /\bC\+\+\b/i, skill: 'C++' },
    { pattern: /\bGo\b/i, skill: 'Go' },
    { pattern: /\bRust\b/i, skill: 'Rust' },
    { pattern: /\bRuby\b/i, skill: 'Ruby' },
    { pattern: /\bPHP\b/i, skill: 'PHP' },
    { pattern: /\bSwift\b/i, skill: 'Swift' },
    { pattern: /\bKotlin\b/i, skill: 'Kotlin' },
    { pattern: /\bReact\b/i, skill: 'React' },
    { pattern: /\bAngular\b/i, skill: 'Angular' },
    { pattern: /\bVue\b/i, skill: 'Vue.js' },
    { pattern: /\bNode\.?js\b/i, skill: 'Node.js' },
    { pattern: /\bExpress\b/i, skill: 'Express' },
    { pattern: /\bHTML\b/i, skill: 'HTML' },
    { pattern: /\bCSS\b/i, skill: 'CSS' },
    { pattern: /\bSQL\b/i, skill: 'SQL' },
    { pattern: /\bGit\b/i, skill: 'Git' },
    { pattern: /\bDocker\b/i, skill: 'Docker' },
    { pattern: /\bAWS\b/i, skill: 'AWS' },
    { pattern: /\bAzure\b/i, skill: 'Azure' },
    { pattern: /\bMongoDB\b/i, skill: 'MongoDB' },
    { pattern: /\bPostgreSQL\b/i, skill: 'PostgreSQL' },
    { pattern: /\bMySQL\b/i, skill: 'MySQL' },
    { pattern: /\bGraphQL\b/i, skill: 'GraphQL' },
    { pattern: /\bREST\b/i, skill: 'REST' },
    { pattern: /\bLinux\b/i, skill: 'Linux' },
    { pattern: /\bAgile\b/i, skill: 'Agile' },
    { pattern: /\bScrum\b/i, skill: 'Scrum' },
    { pattern: /\bJira\b/i, skill: 'Jira' },
  ];

  private extractSkills(text: string): string[] {
    const found = new Set<string>();
    for (const { pattern, skill } of this.SKILL_PATTERNS) {
      if (pattern.test(text)) {
        found.add(skill);
      }
    }
    return [...found];
  }

  // ── Name Extraction ─────────────────────────────────────

  private extractName(text: string): string {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Pattern 1: Look for "Nombre: " or "Name: "
    const namePattern = /(?:Nombre|Name)\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})/i;
    const nameMatch = text.match(namePattern);
    if (nameMatch) return nameMatch[1].trim();
    
    // Pattern 2: First 2-4 capitalized words in first 15 lines
    for (const line of lines.slice(0, 15)) {
      if (line.length > 50 || line.length < 5) continue;
      if (line.includes('@') || line.includes('http')) continue;
      if (/^(Curriculum|CV|Resume|Email|Tel|Phone|Address)/i.test(line)) continue;
      
      const words = line.split(/\s+/).filter(w => w.length > 1);
      if (words.length >= 2 && words.length <= 4) {
        if (words.every(w => /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+$/.test(w))) {
          return line;
        }
      }
    }
    
    // Pattern 3: All caps name
    const capsMatch = text.match(/\b([A-ZÁÉÍÓÚÑÜ]{2,}(?:\s+[A-ZÁÉÍÓÚÑÜ]{2,}){1,3})\b/);
    if (capsMatch) {
      return capsMatch[1].split(' ').map(w => 
        w.charAt(0) + w.slice(1).toLowerCase()
      ).join(' ');
    }
    
    return '';
  }

  // ── Contact Info ────────────────────────────────────────

  private extractEmail(text: string): string {
    const match = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    return match ? match[0] : '';
  }

  private extractPhone(text: string): string {
    const match = text.match(/\+?\d[\d\s\-().]{7,}\d/);
    return match ? match[0].trim() : '';
  }

  // ── Location Extraction ─────────────────────────────────

  private readonly CITIES = [
    'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza',
    'Buenos Aires', 'Santiago', 'Lima', 'Bogotá', 'México', 'Monterrey', 'Guadalajara',
    'London', 'Berlin', 'Paris', 'Amsterdam', 'Dublin', 'Lisbon', 'Milan', 'Rome',
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin', 'Seattle',
    'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Singapore', 'Tokyo',
    'Remote', 'Remoto',
  ];

  private extractLocation(text: string): string {
    for (const city of this.CITIES) {
      if (text.includes(city)) return city;
    }
    return '';
  }

  // ── Experience Extraction ───────────────────────────────

  private extractExperience(text: string): Experience[] {
    const experiences: Experience[] = [];
    
    // Date pattern: 2020 - 2023 or 2020-2023 or 2020|2023
    const datePattern = /(\d{4})\s*[-–—|]\s*(\d{4}|Present|Actual|Presente)/gi;
    let match;
    
    while ((match = datePattern.exec(text)) !== null) {
      const startYear = match[1];
      const endYear = /\d{4}/.test(match[2]) ? match[2] : undefined;
      
      // Get context around the date
      const pos = match.index;
      const context = text.substring(Math.max(0, pos - 200), pos + 200);
      
      experiences.push({
        title: 'Posición',
        company: 'Empresa',
        startDate: `${startYear}-01`,
        endDate: endYear ? `${endYear}-01` : undefined,
        description: '',
        skills: this.extractSkills(context),
      });
    }
    
    // Deduplicate
    const seen = new Set<string>();
    return experiences.filter(e => {
      const key = `${e.startDate}-${e.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  }

  // ── Education Extraction ────────────────────────────────

  private extractEducation(text: string): Education[] {
    const educations: Education[] = [];
    const patterns = [
      /(?:Licenciatura|Grado|Bachelor|Master|Máster|MBA|PhD|Doctorado)\s+(?:en\s+)?([^\n,]{3,50})/gi,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        educations.push({
          degree: match[0],
          institution: 'Institución',
          field: match[1] || 'General',
          startDate: '',
          endDate: '',
        });
      }
    }
    
    return educations.slice(0, 5);
  }

  // ── Languages ───────────────────────────────────────────

  private extractLanguages(text: string): string[] {
    const languages = ['Español', 'Inglés', 'Francés', 'Alemán', 'Portugués', 'Italiano', 'Chino', 'Japonés'];
    const found = languages.filter(lang => 
      text.toLowerCase().includes(lang.toLowerCase())
    );
    return found.length > 0 ? found : ['Español'];
  }

  // ── Summary ─────────────────────────────────────────────

  private extractSummary(text: string): string {
    const match = text.match(/(?:Resumen|Summary|Perfil|Profile)\s*[:\n]\s*([^\n]{50,300})/i);
    return match ? match[1].trim() : '';
  }

  // ── Headline ────────────────────────────────────────────

  private inferHeadline(text: string, skills: string[], experience: Experience[]): string {
    const titlePattern = /(?:Senior|Junior|Lead|Developer|Engineer|Desarrollador)/i;
    const match = text.match(titlePattern);
    if (match) {
      const context = text.substring(match.index || 0, (match.index || 0) + 50);
      return context.split(/\n/)[0].trim();
    }
    
    if (skills.length > 0) {
      return `Desarrollador · ${skills.slice(0, 3).join(', ')}`;
    }
    
    return 'Profesional';
  }
}
