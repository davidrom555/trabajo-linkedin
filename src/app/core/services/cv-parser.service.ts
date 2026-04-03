import { Injectable, inject } from '@angular/core';
import { UserProfile, Experience, Education, ExtractionReport } from '../models/profile.model';
import { DocumentExtractorService } from './document-extractor.service';

@Injectable({ providedIn: 'root' })
export class CvParserService {
  private docExtractor: DocumentExtractorService;

  constructor() {
    // Inject in constructor for proper injection context (works with Web Workers)
    try {
      this.docExtractor = inject(DocumentExtractorService);
    } catch (error) {
      // If in Web Worker context, create fallback (won't work but won't crash)
      console.warn('[CvParser] DocumentExtractorService not available, using fallback extraction');
      this.docExtractor = null as any;
    }
  }

  /** Parse any supported CV file into a UserProfile */
  async parseFile(file: File, includeReport?: boolean): Promise<UserProfile> {
    console.log('[CvParser] Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    try {
      let rawText: string;

      // Try to use DocumentExtractorService if available (main thread)
      if (this.docExtractor) {
        try {
          rawText = await this.docExtractor.extractText(file);
        } catch (extractError) {
          console.warn('[CvParser] DocumentExtractor failed, using fallback:', extractError);
          rawText = await this.fallbackExtractText(file);
        }
      } else {
        // Fallback for Web Worker context (no services available)
        console.log('[CvParser] Using fallback extraction (no DocumentExtractorService)');
        rawText = await this.fallbackExtractText(file);
      }

      if (!rawText || rawText.trim().length === 0) {
        throw new Error('No text extracted from file');
      }

      console.log('[CvParser] ✓ Extracted text length:', rawText.length, 'characters');
      console.log('[CvParser] Preview (first 300 chars):', rawText.substring(0, 300));

      const profile = this.parseText(rawText, file.name);

      // Phase 6: Optionally generate extraction report
      if (includeReport) {
        profile.extractionReport = this.generateExtractionReport(profile);
        console.log('[CvParser] ✓ Report generated:', {
          completeness: profile.extractionReport.overallCompleteness + '%',
          warnings: profile.extractionReport.warnings.length,
          suggestions: profile.extractionReport.suggestions.length,
        });
      }

      return profile;

    } catch (error) {
      console.error('[CvParser] ✗ Error parsing file:', error);
      throw new Error(`Error al procesar CV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /** Fallback text extraction when DocumentExtractorService is unavailable */
  private async fallbackExtractText(file: File): Promise<string> {
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        return await this.extractTextFromPdf(file);
      } else if (
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx') ||
        file.name.endsWith('.doc')
      ) {
        return await this.extractTextFromDoc(file);
      } else {
        return await file.text();
      }
    } catch (error) {
      console.warn('[CvParser] Fallback extraction failed:', error);
      throw error;
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
        return this.fallbackPdfExtraction(arrayBuffer);
      }

      try {
        // Dynamic import
        const pdfjs = await import('pdfjs-dist');

        // Configure worker - try with CDN worker first
        const workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
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
          return this.fallbackPdfExtraction(arrayBuffer);
        }

        console.log('[CvParser] ✓ PDF text extracted, length:', fullText.length);
        return fullText;

      } catch (workerError) {
        console.warn('[CvParser] PDF.js worker setup failed, trying fallback:', workerError);
        return this.fallbackPdfExtraction(arrayBuffer);
      }

    } catch (error) {
      console.error('[CvParser] ✗ PDF extraction failed:', error);
      return this.fallbackPdfExtraction(await file.arrayBuffer());
    }
  }

  /** Fallback PDF extraction for scanned or corrupted PDFs */
  private async fallbackPdfExtraction(data: ArrayBuffer | ArrayBufferLike): Promise<string> {
    try {
      const uint8Array = new Uint8Array(data);

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
  parseText(text: string, fileName: string): UserProfile {
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
      email: email || undefined,
      phone: phone || undefined,
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

  // ── FASE 1: Intelligent Section Detection ────────────────

  /** Find and extract specific sections from CV text */
  private findSections(text: string): Map<string, string> {
    const sections = new Map<string, string>();

    // Patterns for section headers (English/Spanish/Combined)
    const sectionPatterns = [
      {
        key: 'skills',
        patterns: ['skills', 'competencias', 'habilidades', 'abilities', 'technical skills', 'core competencies'],
      },
      {
        key: 'experience',
        patterns: ['experiencia', 'experience', 'trabajo', 'work experience', 'professional experience', 'employment'],
      },
      {
        key: 'education',
        patterns: ['educación', 'education', 'estudios', 'academic', 'formation', 'training'],
      },
      {
        key: 'languages',
        patterns: ['idiomas', 'languages', 'lenguas', 'linguistic'],
      },
      {
        key: 'summary',
        patterns: ['resumen', 'summary', 'sobre mí', 'about me', 'professional summary', 'objective', 'objetivo'],
      },
      {
        key: 'contact',
        patterns: ['contacto', 'contact', 'información de contacto', 'contact information'],
      },
      {
        key: 'certifications',
        patterns: ['certificaciones', 'certifications', 'certificados', 'certificates', 'credentials'],
      },
    ];

    // Build regex with all section patterns
    for (const { key, patterns } of sectionPatterns) {
      // Create case-insensitive pattern: (?:Skills|Competencias|Habilidades)
      const patternStr = patterns.join('|');

      // Match section header and content until next section
      // Pattern: "Header:" or "Header\n" followed by content
      const sectionRegex = new RegExp(
        `(?:^|\\n)\\s*(?:${patternStr})\\s*[:–\\-]?\\s*\\n([^\\n]*(?:\\n(?!(?:${sectionPatterns.map(s => s.patterns.join('|')).join('|')})[\\s:–\\-])[^\\n]*)*)`,
        'gmi'
      );

      const match = sectionRegex.exec(text);
      if (match && match[1]) {
        sections.set(key, match[1].trim());
      }
    }

    return sections;
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
    const sections = this.findSections(text);

    // PASO 1: Extract predefined skills from all text
    for (const { pattern, skill } of this.SKILL_PATTERNS) {
      if (pattern.test(text)) {
        found.add(skill);
      }
    }

    // PASO 2: Extract custom skills from "skills" section
    const skillsSection = sections.get('skills');
    if (skillsSection) {
      const customSkills = this.parseSkillsSection(skillsSection);
      customSkills.forEach(s => found.add(s));
    }

    // PASO 3: Extract technologies mentioned in experience section
    const expSection = sections.get('experience');
    if (expSection) {
      const techFromExperience = this.extractTechFromExperience(expSection);
      techFromExperience.forEach(t => found.add(t));
    }

    // PASO 4: Filter stopwords and invalid entries
    const filtered = this.filterStopwords(Array.from(found));

    return filtered.sort();
  }

  // ── FASE 2: Enhanced Skills Extraction ──────────────────

  /** Parse skills section and extract individual skills */
  private parseSkillsSection(skillsText: string): string[] {
    const skills = skillsText
      .split(/[,\n•·\-|\/]/)
      .map(s => s.trim())
      .filter(s => {
        return (
          s.length > 1 &&
          s.length < 60 &&
          !/^\d+$/.test(s) &&
          !s.includes('@') &&
          !s.match(/^\d{4}/)
        );
      });

    return skills;
  }

  /** Extract technologies mentioned in experience context */
  private extractTechFromExperience(experienceText: string): string[] {
    const techPattern = /\b([A-Z][a-zA-Z0-9.\-+#]*(?:\.[a-zA-Z0-9.\-+#]*)?)\b(?=\s*[,.\)])/g;
    const matches = experienceText.match(techPattern) || [];

    return matches.filter(m =>
      m.length > 2 &&
      m.length < 40 &&
      !/^\d/.test(m) &&
      !m.includes('http')
    );
  }

  /** Filter common stopwords and invalid entries */
  private filterStopwords(skills: string[]): string[] {
    const stopwords = [
      'the', 'a', 'an', 'is', 'it', 'and', 'or', 'but', 'with', 'from', 'to', 'for', 'at', 'on', 'in', 'of',
      'management', 'skills', 'experience', 'knowledge', 'ability', 'understanding', 'proficiency',
      'years', 'year', 'month', 'months', 'day', 'days', 'working', 'work', 'worked',
      'strong', 'excellent', 'good', 'advanced', 'intermediate', 'basic',
    ];

    return skills.filter(
      s =>
        !stopwords.includes(s.toLowerCase()) &&
        s.length > 2 &&
        !/^\d/.test(s) &&
        !s.includes('http')
    );
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

    // Date patterns:
    // - 2020 - 2023 or 2020-2023
    // - 01/2024 - Actualidad or 01/2024 - 12/2025
    // - 2020 - Presente
    const datePatterns = [
      // MM/YYYY - MM/YYYY or MM/YYYY - Actualidad/Presente
      /(\d{2})\/(\d{4})\s*[-–—|]\s*(?:(\d{2})\/(\d{4})|Actualidad|Presente|Actual|Now)/gi,
      // YYYY - YYYY or YYYY - Actualidad/Presente
      /(\d{4})\s*[-–—|]\s*(\d{4}|Present|Actual|Presente|Actualidad|Now)/gi,
    ];

    for (const datePattern of datePatterns) {
      let match;
      while ((match = datePattern.exec(text)) !== null) {
        let startYear: string;
        let endYear: string | undefined;
        
        // Check if it's MM/YYYY format (has 4 capture groups)
        if (match[3] !== undefined || match[0].includes('/')) {
          // MM/YYYY format
          startYear = match[2]; // Year from start date
          endYear = match[4] || undefined; // Year from end date if exists
        } else {
          // YYYY format
          startYear = match[1];
          endYear = /\d{4}/.test(match[2]) ? match[2] : undefined;
        }

      // Get context around the date - expand window for better extraction
      const pos = match.index;
      const contextStart = Math.max(0, pos - 300);
      const contextEnd = Math.min(text.length, pos + 300);
      const context = text.substring(contextStart, contextEnd);

      // Extract title and company from context
      const { title, company } = this.extractTitleAndCompany(context, text.substring(contextStart, pos));

      // PHASE 3: Extract achievements and technologies
      const achievements = this.extractAchievements(context);
      const technologies = this.extractTechnologiesFromRole(context);

      experiences.push({
        title: title || 'Posición',
        company: company || 'Empresa',
        startDate: `${startYear}-01`,
        endDate: endYear ? `${endYear}-01` : undefined,
        description: this.extractJobDescription(context),
        skills: this.extractSkills(context),
        achievements: achievements.length > 0 ? achievements : undefined,
        technologies: technologies.length > 0 ? technologies : undefined,
      });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return experiences.filter(e => {
      const key = `${e.startDate}-${e.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private extractTitleAndCompany(context: string, beforeDate: string): { title: string; company: string } {
    // Try to find patterns like "Job Title at Company"
    const titleCompanyPattern = /([A-Z][a-záéíóúñ\s]{2,30})\s+(?:at|en|at|@)\s+([A-Z][a-záéíóúñ\s]{2,40})/i;
    const match = context.match(titleCompanyPattern);

    if (match) {
      return {
        title: match[1].trim(),
        company: match[2].trim(),
      };
    }

    // Alternative: Look for company name patterns (in caps or with Ltd, Inc, etc.)
    const companyPattern = /\b([A-Z][a-záéíóúñ\w\s&.,]{2,40}(?:Ltd|Inc|Corp|SA|SL|LLC)?)\b/;
    const companyMatch = beforeDate.match(companyPattern);

    // Extract lines from context for title
    const lines = context.split('\n').filter(l => l.trim().length > 0);
    let title = '';
    let company = companyMatch ? companyMatch[1].trim() : '';

    // Find likely title in previous lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Likely title: not too short, not too long, capitalized
      if (line.length > 5 && line.length < 80 &&
          /^[A-Z]/.test(line) &&
          !line.includes('@') &&
          !line.includes('http')) {
        title = line;
      }
    }

    return { title, company };
  }

  private extractJobDescription(context: string): string {
    const lines = context.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 10 && l.length < 150);

    // Get a reasonable description (usually in the middle lines)
    if (lines.length > 2) {
      return lines.slice(1, 3).join(' ');
    }

    return '';
  }

  // ── PHASE 3: Extract Achievements ──────────────────────

  /** Extract achievements (bullet points with action verbs) */
  private extractAchievements(context: string): string[] {
    const achievements: string[] = [];

    // Action verbs commonly used in achievements
    const actionVerbs = [
      'achieved', 'led', 'developed', 'implemented', 'improved', 'increased',
      'decreased', 'reduced', 'delivered', 'built', 'created', 'designed',
      'optimized', 'enhanced', 'managed', 'coordinated', 'oversaw',
      'logré', 'lideré', 'desarrollé', 'implementé', 'mejoré', 'aumenté',
      'reduje', 'entregué', 'construí', 'creé', 'diseñé', 'optimicé',
    ];

    const lines = context.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    for (const line of lines) {
      // Check if line starts with bullet point or dash
      const isBullet = /^[•·\-*]\s+/.test(line);
      const startsWithVerb = actionVerbs.some(verb =>
        new RegExp(`^${verb}`, 'i').test(line.replace(/^[•·\-*]\s+/, ''))
      );

      if ((isBullet || startsWithVerb) && line.length > 10 && line.length < 200) {
        // Clean up bullet points
        const cleaned = line.replace(/^[•·\-*]\s+/, '').trim();
        if (cleaned.length > 10) {
          achievements.push(cleaned);
        }
      }
    }

    return achievements.slice(0, 10); // Max 10 achievements per role
  }

  /** Extract technologies used in this specific role */
  private extractTechnologiesFromRole(context: string): string[] {
    const technologies = new Set<string>();

    // Technology patterns: capitalized words that look like tech (with dots, +, #)
    const techPattern = /\b([A-Z][a-zA-Z0-9.\-+#]*(?:\.[a-zA-Z0-9.\-+#]*)?)\b/g;
    const matches = context.matchAll(techPattern);

    for (const match of matches) {
      const tech = match[0];

      // Filter valid tech: 2-40 chars, starts with capital, not pure number
      if (tech.length >= 2 && tech.length <= 40 &&
          !/^\d/.test(tech) &&
          !tech.includes('http') &&
          !['The', 'A', 'An', 'I', 'In', 'At', 'On', 'By', 'From', 'With', 'For', 'As'].includes(tech)) {

        technologies.add(tech);
      }
    }

    // Combine with skills found in experience context
    const contextSkills = this.extractSkills(context);
    contextSkills.forEach(skill => technologies.add(skill));

    return Array.from(technologies).slice(0, 15); // Max 15 technologies per role
  }

  // ── PHASE 4: Education Extraction ──────────────────────

  private extractEducation(text: string): Education[] {
    const educations: Education[] = [];
    
    // Expanded patterns for education types
    const patterns = [
      // University degrees
      /(?:Licenciatura|Grado|Bachelor|Master|Máster|MBA|PhD|Doctorado|Ingeniería|Tecnicatura)\s+(?:en\s+)?([^\n,]{3,50})/gi,
      // Courses and certifications with platform names
      /([^\n,]{3,60})\s*(?:--|-|–)\s*(?:Centro de e-Learning|UTN(?:\.BA)?|Coderhouse|Coursera|Udemy|Platzi|LinkedIn Learning|Domestika|EducaciónIT|Digital House|Acámica|Educación IT)(?:\s*--\s*|\s+-\s+|\s*)(\d+\s*hs?)?/gi,
      // Certifications
      /(?:Certificación|Certification|Certificate|Curso|Course)\s+(?:en\s+|de\s+)?([^\n,]{3,60})/gi,
      // Bootcamps
      /(?:Bootcamp|Intensivo)\s+(?:en\s+)?([^\n,]{3,50})/gi,
    ];

    // Also look for education section specifically
    const educationSection = this.findEducationSection(text);
    const searchText = educationSection || text;

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(searchText)) !== null) {
        const degree = match[0].trim();
        const field = match[1]?.trim() || 'General';

        // Get context to find institution
        const pos = match.index;
        const contextStart = Math.max(0, pos - 250);
        const contextEnd = Math.min(searchText.length, pos + 250);
        const context = searchText.substring(contextStart, contextEnd);

        const institution = this.extractInstitution(context);
        const { startDate, endDate } = this.extractEducationDates(context);

        // Extract additional fields
        const type = this.detectEducationType(degree);
        const hours = this.extractHours(context);
        const status = endDate ? 'completed' : 'in-progress';

        educations.push({
          type,
          degree,
          institution: institution || this.extractPlatformFromDegree(degree) || 'Institución',
          field,
          startDate,
          endDate,
          status: status as 'completed' | 'in-progress',
        });
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return educations.filter(e => {
      const key = `${e.degree}-${e.institution}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /** Extract education section from CV */
  private findEducationSection(text: string): string | null {
    const educationHeaders = /(?:EDUCACIÓN|EDUCATION|FORMACIÓN|FORMACIÓN ACADÉMICA|ESTUDIOS|CURSOS|CERTIFICACIONES)/i;
    const match = text.match(educationHeaders);
    if (match && match.index !== undefined) {
      const startIndex = match.index;
      // Get text until next major section or end
      const nextSection = text.substring(startIndex + 1).search(/(?:EXPERIENCIA|EXPERIENCE|HABILIDADES|SKILLS|PROYECTOS|PROJECTS|IDIOMAS|LANGUAGES)\s*\n/i);
      const endIndex = nextSection > -1 ? startIndex + 1 + nextSection : text.length;
      return text.substring(startIndex, endIndex);
    }
    return null;
  }

  /** Extract hours from education context */
  private extractHours(context: string): string | undefined {
    const hoursMatch = context.match(/(\d+)\s*(?:hs|horas|hours)/i);
    return hoursMatch ? `${hoursMatch[1]} horas` : undefined;
  }

  /** Extract platform name from degree text */
  private extractPlatformFromDegree(degree: string): string | undefined {
    const platforms = ['UTN', 'UTN.BA', 'Coderhouse', 'Coursera', 'Udemy', 'Platzi', 'Digital House'];
    for (const platform of platforms) {
      if (degree.includes(platform)) {
        return platform;
      }
    }
    return undefined;
  }

  private extractInstitution(context: string): string {
    // Look for patterns like "at University of X" or "Universidad de X"
    const universityPattern = /(?:Universidad|University|Institute|Instituo|Escuela|School)\s+(?:de\s+)?([A-Za-záéíóúñÁÉÍÓÚÑ\s&.,]{3,50})/i;
    const match = context.match(universityPattern);

    if (match) {
      return match[1].trim();
    }

    // Alternative: look for capitalized organizations in the context
    const lines = context.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 5 && l.length < 100 && /^[A-Z]/.test(l));

    if (lines.length > 0) {
      return lines[0];
    }

    return '';
  }

  private extractEducationDates(context: string): { startDate: string; endDate?: string } {
    // Look for date patterns in education context
    const datePattern = /(\d{4})\s*[-–—|]\s*(\d{4}|Present|Actual|Presente|Today)/i;
    const match = context.match(datePattern);

    if (match) {
      const startYear = match[1];
      const endYear = /\d{4}/.test(match[2]) ? match[2] : undefined;
      return {
        startDate: `${startYear}-01`,
        endDate: endYear ? `${endYear}-01` : undefined,
      };
    }

    // Alternative: look for just a year
    const yearPattern = /(\d{4})/;
    const yearMatch = context.match(yearPattern);
    if (yearMatch) {
      return { startDate: `${yearMatch[1]}-01` };
    }

    return { startDate: '' };
  }

  // ── PHASE 4: Enhanced Education Fields ─────────────────

  /** Detect education type (degree, certification, bootcamp, course) */
  private detectEducationType(degreeText: string): 'degree' | 'certification' | 'bootcamp' | 'course' {
    const lowerText = degreeText.toLowerCase();

    if (/bootcamp/.test(lowerText)) return 'bootcamp';
    if (/course|cursillo/.test(lowerText)) return 'course';
    if (/certification|certified|certificate|certificado/.test(lowerText)) return 'certification';
    if (/bachelor|licenciatura|grado|master|máster|phd|doctorado|mba/.test(lowerText)) return 'degree';

    return 'degree'; // Default
  }

  /** Extract GPA if present (e.g., "GPA: 3.8/4.0") */
  private extractGPA(context: string): string {
    const gpaPattern = /GPA\s*:?\s*(\d+\.\d+)\s*\/\s*(\d+\.\d+|\d+)/i;
    const match = context.match(gpaPattern);
    if (match) {
      return `${match[1]}/${match[2]}`;
    }
    return '';
  }

  /** Extract honors (e.g., "Summa Cum Laude", "Magna Cum Laude", "Honors") */
  private extractHonors(context: string): string {
    const honorsPattern = /(?:Summa|Magna|Cum Laude|With Honors|Honors|Distinción|Mención de Honor|Sobresaliente)/i;
    const match = context.match(honorsPattern);
    if (match) {
      return match[0].trim();
    }
    return '';
  }

  /** Extract relevant coursework (courses mentioned in parentheses or after "Relevant Coursework:") */
  private extractRelevantCoursework(context: string): string[] {
    const coursework: string[] = [];

    // Pattern 1: "Relevant Coursework: Course1, Course2, Course3"
    const relevantPattern = /(?:Relevant Coursework|Cursos Relevantes?|Asignaturas)\s*:?\s*([^\n]+)/i;
    const relevantMatch = context.match(relevantPattern);
    if (relevantMatch) {
      const courses = relevantMatch[1]
        .split(/[,;]/)
        .map(c => c.trim())
        .filter(c => c.length > 2 && c.length < 80);
      coursework.push(...courses);
    }

    // Pattern 2: Look for parentheses with course-like content
    const parenthesesPattern = /\(([A-Z][a-zA-Z0-9\s&,–-]+)\)/g;
    let match;
    while ((match = parenthesesPattern.exec(context)) !== null) {
      const content = match[1].trim();
      // Filter out false positives
      if (content.length > 3 && content.length < 100 &&
          !content.includes('@') &&
          !content.includes('http') &&
          !content.match(/^\d{4}/)) {
        coursework.push(content);
      }
    }

    // Deduplicate and limit to 10 courses
    const unique = Array.from(new Set(coursework));
    return unique.slice(0, 10);
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
    // Try to find explicit summary section
    const summaryPatterns = [
      /(?:Resumen|Summary|Perfil|Profile|Sobre mí|About me)\s*[:\n]\s*([^\n]{50,300})/i,
      /(?:Objetivo|Objetivo profesional|Professional objective)\s*[:\n]\s*([^\n]{50,300})/i,
    ];

    for (const pattern of summaryPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If no explicit summary, extract first meaningful paragraph
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 30 && l.length < 300);

    // Skip header lines and find first descriptive paragraph
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Skip lines that look like headers or dates
      if (!/^\d{4}|^(?:Experiencia|Education|Skills|Idiomas)/i.test(line) &&
          !line.includes('@') &&
          !line.match(/\d{4}\s*[-–]\s*\d{4}/)) {
        return line;
      }
    }

    return '';
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

  // ── PHASE 5: Extraction Report ─────────────────────────

  /** Generate an extraction report with metrics and suggestions */
  generateExtractionReport(profile: UserProfile): ExtractionReport {
    const scores = {
      skills: this.scoreSkills(profile.skills),
      experience: this.scoreExperience(profile.experience),
      education: this.scoreEducation(profile.education),
      languages: profile.languages.length,
      summary: this.scoreSummary(profile.summary),
      contact: this.scoreContact(profile),
    };

    // Calculate overall completeness (weighted average)
    const overallCompleteness = Math.round(
      (scores.skills * 0.15 +
        scores.experience.completeness * 0.20 +
        scores.education.completeness * 0.15 +
        (scores.languages > 0 ? 1 : 0) * 0.10 +
        scores.summary * 0.15 +
        scores.contact * 0.25) * 100
    );

    const warnings = this.detectWarnings(profile);
    const suggestions = this.generateSuggestions(profile, warnings);

    return {
      overallCompleteness,
      timestamp: new Date(),
      sections: {
        skills: { found: profile.skills.length, confidence: scores.skills },
        experience: {
          found: profile.experience.length,
          completeness: scores.experience.completeness,
          achievements: profile.experience.reduce((sum, e) => sum + (e.achievements?.length || 0), 0),
        },
        education: {
          found: profile.education.length,
          completeness: scores.education.completeness,
          types: {
            degree: profile.education.filter(e => e.type === 'degree').length,
            certification: profile.education.filter(e => e.type === 'certification').length,
            bootcamp: profile.education.filter(e => e.type === 'bootcamp').length,
          },
        },
        languages: { found: scores.languages, withLevels: false },
        summary: {
          found: !!profile.summary && profile.summary.length > 0,
          confidence: scores.summary,
          length: profile.summary?.length || 0,
        },
        contact: {
          email: !!profile.email,
          phone: !!profile.phone,
          location: !!profile.location,
        },
      },
      warnings,
      suggestions,
    };
  }

  /** Score skills completeness (0-1) */
  private scoreSkills(skills: string[]): number {
    if (skills.length === 0) return 0;
    if (skills.length < 5) return 0.3;
    if (skills.length < 10) return 0.6;
    if (skills.length < 20) return 0.85;
    return 1.0;
  }

  /** Score experience completeness (0-1) */
  private scoreExperience(experience: Experience[]): { completeness: number } {
    if (experience.length === 0) return { completeness: 0 };

    let totalCompleteness = 0;
    for (const exp of experience) {
      let score = 0;
      if (exp.title) score += 0.25;
      if (exp.company) score += 0.25;
      if (exp.description && exp.description.length > 20) score += 0.25;
      if (exp.achievements && exp.achievements.length > 0) score += 0.25;
      totalCompleteness += score;
    }

    return { completeness: Math.min(1.0, totalCompleteness / experience.length) };
  }

  /** Score education completeness (0-1) */
  private scoreEducation(education: Education[]): { completeness: number } {
    if (education.length === 0) return { completeness: 0 };

    let totalCompleteness = 0;
    for (const edu of education) {
      let score = 0;
      if (edu.degree) score += 0.2;
      if (edu.institution) score += 0.2;
      if (edu.field) score += 0.2;
      if (edu.startDate) score += 0.2;
      if (edu.gpa || edu.honors) score += 0.2;
      totalCompleteness += score;
    }

    return { completeness: Math.min(1.0, totalCompleteness / education.length) };
  }

  /** Score summary quality (0-1) */
  private scoreSummary(summary: string): number {
    if (!summary || summary.length === 0) return 0;
    if (summary.length < 50) return 0.3;
    if (summary.length < 100) return 0.6;
    if (summary.length < 300) return 0.9;
    return 1.0;
  }

  /** Score contact information completeness (0-1) */
  private scoreContact(profile: UserProfile): number {
    let score = 0;
    if (profile.email) score += 0.33;
    if (profile.phone) score += 0.33;
    if (profile.location) score += 0.34;
    return score;
  }

  /** Detect issues with extracted data */
  private detectWarnings(profile: UserProfile): string[] {
    const warnings: string[] = [];

    if (profile.skills.length < 5) {
      warnings.push(`Solo se encontraron ${profile.skills.length} skills (se esperaban al menos 5)`);
    }

    if (profile.experience.length === 0) {
      warnings.push('No se encontró sección de experiencia laboral');
    } else if (profile.experience.length === 1) {
      warnings.push('Solo se encontró 1 experiencia (se esperaban al menos 2)');
    }

    if (profile.education.length === 0) {
      warnings.push('No se encontró sección de educación');
    }

    if (!profile.summary || profile.summary.length < 50) {
      warnings.push('Resumen profesional muy corto o vacío');
    }

    if (!profile.phone) {
      warnings.push('No se encontró número de teléfono');
    }

    if (!profile.email) {
      warnings.push('No se encontró dirección de correo electrónico');
    }

    return warnings;
  }

  /** Generate improvement suggestions */
  private generateSuggestions(profile: UserProfile, warnings: string[]): string[] {
    const suggestions: string[] = [];

    if (profile.skills.length < 10) {
      suggestions.push('Considera agregar más habilidades técnicas específicas a tu CV');
    }

    if (profile.experience.length < 2) {
      suggestions.push('Es recomendable incluir al menos 2 experiencias laborales para mayor competitividad');
    }

    if (!profile.summary || profile.summary.length < 100) {
      suggestions.push('Completa tu resumen profesional con un párrafo descriptivo más detallado (mínimo 100 caracteres)');
    }

    const achievementCount = profile.experience.reduce((sum, e) => sum + (e.achievements?.length || 0), 0);
    if (achievementCount === 0 && profile.experience.length > 0) {
      suggestions.push('Añade logros específicos (achievements) a tus experiencias laborales para destacar resultados');
    }

    if (profile.languages.length < 2) {
      suggestions.push('Especifica los idiomas que hablas para mejorar tu perfil');
    }

    if (!profile.location) {
      suggestions.push('Incluye tu ubicación geográfica en el CV');
    }

    return suggestions;
  }
}
