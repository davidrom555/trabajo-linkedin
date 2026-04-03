import { Injectable } from '@angular/core';
import { UserProfile, Experience, Education } from '../models/profile.model';

// pdfjs-dist types
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}
interface PDFPageProxy {
  getTextContent(): Promise<{ items: Array<{ str: string }> }>;
}

@Injectable({ providedIn: 'root' })
export class CvParserService {
  private pdfjsLib: any = null;

  /** Lazy-load pdf.js only when needed */
  private async loadPdfJs(): Promise<any> {
    if (this.pdfjsLib) return this.pdfjsLib;
    const pdfjs = await import('pdfjs-dist');
    // Disable worker to avoid CORS/version issues - runs in main thread (slower but works)
    (pdfjs.GlobalWorkerOptions as any).workerSrc = '';
    this.pdfjsLib = pdfjs;
    return pdfjs;
  }

  /** Extract raw text from a PDF file */
  async extractTextFromPdf(file: File): Promise<string> {
    const pdfjs = await this.loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('[CvParser] Parsing PDF, size:', file.size);
    
    // Use disableStream and disableAutoFetch for better compatibility
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
      cMapUrl: null,
      cMapPacked: false,
      disableStream: true,
      disableAutoFetch: true,
    });
    
    const pdf: PDFDocumentProxy = await loadingTask.promise;

    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: { str: string }) => item.str).join(' ');
      pages.push(text);
    }

    return pages.join('\n');
  }

  /** Extract text from DOC/DOCX by reading as text (basic) */
  async extractTextFromDoc(file: File): Promise<string> {
    // For DOCX, we read the raw text content
    // A proper implementation would use mammoth.js, but for now we extract what we can
    const text = await file.text();
    // Clean XML/binary artifacts
    return text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /** Main entry: parse any supported CV file into a UserProfile */
  async parseFile(file: File): Promise<UserProfile> {
    let rawText: string;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      rawText = await this.extractTextFromPdf(file);
    } else {
      rawText = await this.extractTextFromDoc(file);
    }

    console.log('[CvParser] Extracted text length:', rawText.length);
    console.log('[CvParser] First 500 chars:', rawText.substring(0, 500));

    return this.parseText(rawText, file.name);
  }

  /** Parse extracted text into a structured profile */
  private parseText(text: string, fileName: string): UserProfile {
    const skills = this.extractSkills(text);
    const name = this.extractName(text);
    const email = this.extractEmail(text);
    const phone = this.extractPhone(text);
    const location = this.extractLocation(text);
    const experience = this.extractExperience(text);
    const education = this.extractEducation(text);
    const languages = this.extractLanguages(text);
    const headline = this.inferHeadline(text, skills, experience);
    const summary = this.extractSummary(text);

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

  // ── Skill Extraction ────────────────────────────────────

  private readonly SKILL_PATTERNS: Array<{ pattern: RegExp; skill: string }> = [
    // Programming languages
    { pattern: /\bJavaScript\b/i, skill: 'JavaScript' },
    { pattern: /\bTypeScript\b/i, skill: 'TypeScript' },
    { pattern: /\bPython\b/i, skill: 'Python' },
    { pattern: /\bJava\b(?!Script)/i, skill: 'Java' },
    { pattern: /\bC#\b|\.NET/i, skill: 'C#' },
    { pattern: /\bC\+\+\b/i, skill: 'C++' },
    { pattern: /\bGolang\b|\bGo\b(?:\s+(?:lang|programming))/i, skill: 'Go' },
    { pattern: /\bRust\b/i, skill: 'Rust' },
    { pattern: /\bRuby\b/i, skill: 'Ruby' },
    { pattern: /\bPHP\b/i, skill: 'PHP' },
    { pattern: /\bSwift\b/i, skill: 'Swift' },
    { pattern: /\bKotlin\b/i, skill: 'Kotlin' },
    { pattern: /\bScala\b/i, skill: 'Scala' },
    { pattern: /\bR\b(?:\s+(?:programming|language|studio))/i, skill: 'R' },

    // Frontend
    { pattern: /\bReact\b(?![\s-]*Native)/i, skill: 'React' },
    { pattern: /\bAngular\b/i, skill: 'Angular' },
    { pattern: /\bVue\.?js?\b|\bVue\b/i, skill: 'Vue.js' },
    { pattern: /\bSvelte\b/i, skill: 'Svelte' },
    { pattern: /\bNext\.?js\b/i, skill: 'Next.js' },
    { pattern: /\bNuxt\b/i, skill: 'Nuxt' },
    { pattern: /\bHTML\b/i, skill: 'HTML' },
    { pattern: /\bCSS\b/i, skill: 'CSS' },
    { pattern: /\bSCSS\b|\bSass\b/i, skill: 'SCSS' },
    { pattern: /\bTailwind\b/i, skill: 'Tailwind CSS' },
    { pattern: /\bBootstrap\b/i, skill: 'Bootstrap' },
    { pattern: /\bjQuery\b/i, skill: 'jQuery' },

    // Backend
    { pattern: /\bNode\.?js\b/i, skill: 'Node.js' },
    { pattern: /\bExpress\.?js?\b|\bExpress\b/i, skill: 'Express' },
    { pattern: /\bNestJS\b/i, skill: 'NestJS' },
    { pattern: /\bDjango\b/i, skill: 'Django' },
    { pattern: /\bFlask\b/i, skill: 'Flask' },
    { pattern: /\bFastAPI\b/i, skill: 'FastAPI' },
    { pattern: /\bSpring\b/i, skill: 'Spring' },
    { pattern: /\bLaravel\b/i, skill: 'Laravel' },
    { pattern: /\bRails\b|Ruby\s+on\s+Rails/i, skill: 'Rails' },

    // Cloud & DevOps
    { pattern: /\bAWS\b|Amazon\s+Web\s+Services/i, skill: 'AWS' },
    { pattern: /\bAzure\b/i, skill: 'Azure' },
    { pattern: /\bGCP\b|Google\s+Cloud/i, skill: 'GCP' },
    { pattern: /\bDocker\b/i, skill: 'Docker' },
    { pattern: /\bKubernetes\b|\bK8s\b/i, skill: 'Kubernetes' },
    { pattern: /\bTerraform\b/i, skill: 'Terraform' },
    { pattern: /\bCI\s*\/\s*CD\b/i, skill: 'CI/CD' },
    { pattern: /\bJenkins\b/i, skill: 'Jenkins' },
    { pattern: /\bGitHub\s+Actions\b/i, skill: 'GitHub Actions' },
    { pattern: /\bAnsible\b/i, skill: 'Ansible' },

    // Databases
    { pattern: /\bPostgreSQL\b|\bPostgres\b/i, skill: 'PostgreSQL' },
    { pattern: /\bMySQL\b/i, skill: 'MySQL' },
    { pattern: /\bMongoDB\b/i, skill: 'MongoDB' },
    { pattern: /\bRedis\b/i, skill: 'Redis' },
    { pattern: /\bElasticsearch\b/i, skill: 'Elasticsearch' },
    { pattern: /\bDynamoDB\b/i, skill: 'DynamoDB' },
    { pattern: /\bSQLite\b/i, skill: 'SQLite' },
    { pattern: /\bCassandra\b/i, skill: 'Cassandra' },
    { pattern: /\bFirebase\b/i, skill: 'Firebase' },
    { pattern: /\bSupabase\b/i, skill: 'Supabase' },

    // APIs & protocols
    { pattern: /\bGraphQL\b/i, skill: 'GraphQL' },
    { pattern: /\bREST\b(?:ful)?/i, skill: 'REST' },
    { pattern: /\bgRPC\b/i, skill: 'gRPC' },
    { pattern: /\bWebSocket\b/i, skill: 'WebSocket' },

    // Data & ML
    { pattern: /\bMachine\s+Learning\b/i, skill: 'Machine Learning' },
    { pattern: /\bDeep\s+Learning\b/i, skill: 'Deep Learning' },
    { pattern: /\bTensorFlow\b/i, skill: 'TensorFlow' },
    { pattern: /\bPyTorch\b/i, skill: 'PyTorch' },
    { pattern: /\bPandas\b/i, skill: 'Pandas' },
    { pattern: /\bNumPy\b/i, skill: 'NumPy' },
    { pattern: /\bSpark\b/i, skill: 'Spark' },
    { pattern: /\bKafka\b/i, skill: 'Kafka' },
    { pattern: /\bAirflow\b/i, skill: 'Airflow' },

    // Mobile
    { pattern: /\bReact\s*Native\b/i, skill: 'React Native' },
    { pattern: /\bFlutter\b/i, skill: 'Flutter' },
    { pattern: /\bIonic\b/i, skill: 'Ionic' },
    { pattern: /\bCapacitor\b/i, skill: 'Capacitor' },

    // Tools & practices
    { pattern: /\bGit\b(?!Hub|Lab)/i, skill: 'Git' },
    { pattern: /\bLinux\b/i, skill: 'Linux' },
    { pattern: /\bAgile\b/i, skill: 'Agile' },
    { pattern: /\bScrum\b/i, skill: 'Scrum' },
    { pattern: /\bJira\b/i, skill: 'Jira' },
    { pattern: /\bFigma\b/i, skill: 'Figma' },
    { pattern: /\bSQL\b/i, skill: 'SQL' },
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
    // Typically the name is the very first meaningful text in a CV
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 5)) {
      // Skip lines that look like headers, emails, phones
      if (line.includes('@') || /^\+?\d[\d\s\-()]{6,}/.test(line)) continue;
      if (line.length > 60) continue;
      // A name is usually 2-4 words, all capitalized
      const words = line.split(/\s+/);
      if (
        words.length >= 2 &&
        words.length <= 5 &&
        words.every((w) => /^[A-ZÁÉÍÓÚÑÜ]/.test(w))
      ) {
        return line;
      }
    }
    // Fallback: first short line
    const firstShort = lines.find((l) => l.length > 3 && l.length < 50 && !l.includes('@'));
    return firstShort || '';
  }

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
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Austin', 'Seattle', 'Boston',
    'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Singapore', 'Tokyo',
    'Remote', 'Remoto',
  ];

  private extractLocation(text: string): string {
    for (const city of this.CITIES) {
      const regex = new RegExp(`\\b${city}\\b`, 'i');
      if (regex.test(text)) {
        // Try to find "City, Country" pattern
        const contextRegex = new RegExp(`${city}[,\\s]+([A-ZÁÉÍÓÚ][a-záéíóú]+(?:\\s+[A-ZÁÉÍÓÚ][a-záéíóú]+)?)`, 'i');
        const contextMatch = text.match(contextRegex);
        if (contextMatch) {
          return `${city}, ${contextMatch[1]}`;
        }
        return city;
      }
    }
    return '';
  }

  // ── Experience Extraction ───────────────────────────────

  private extractExperience(text: string): Experience[] {
    const experiences: Experience[] = [];

    // Match patterns like "2020 - 2023" or "Jan 2020 - Present" or "2019 - Presente"
    const dateRangePattern =
      /(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)[a-z]*\.?\s+)?(\d{4})\s*[-–—]\s*(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic)[a-z]*\.?\s+)?(\d{4}|[Pp]resent[e]?|[Aa]ctual)/g;

    const lines = text.split(/\n/);
    let matches: RegExpExecArray | null;

    while ((matches = dateRangePattern.exec(text)) !== null) {
      const startYear = matches[1];
      const endRaw = matches[2];
      const endYear = /\d{4}/.test(endRaw) ? endRaw : undefined;

      // Look for context around this date range
      const pos = matches.index;
      const contextBefore = text.substring(Math.max(0, pos - 200), pos);
      const contextAfter = text.substring(pos, Math.min(text.length, pos + 300));

      // Try to extract title and company from surrounding text
      const titleLine = contextBefore.split(/\n/).filter(Boolean).pop() || '';
      const companyLine = contextAfter.split(/\n/).filter(Boolean)[1] || '';

      experiences.push({
        title: this.cleanLine(titleLine) || 'Posición',
        company: this.cleanLine(companyLine) || 'Empresa',
        startDate: `${startYear}-01`,
        endDate: endYear ? `${endYear}-01` : undefined,
        description: this.cleanLine(contextAfter.substring(0, 150)),
        skills: this.extractSkills(contextBefore + contextAfter),
      });
    }

    // Deduplicate by start date
    const seen = new Set<string>();
    return experiences.filter((e) => {
      if (seen.has(e.startDate)) return false;
      seen.add(e.startDate);
      return true;
    });
  }

  // ── Education Extraction ────────────────────────────────

  private extractEducation(text: string): Education[] {
    const degrees: Education[] = [];
    const degreePatterns = [
      /(?:Bachelor|Master|PhD|Doctorado|Licenciatura|Ingenier[íi]a|Grado|Máster|MBA|BSc|MSc|B\.?S\.?|M\.?S\.?)\s*(?:en|in|of|degree)?\s*([^\n,]{3,50})/gi,
    ];

    for (const pattern of degreePatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const field = this.cleanLine(match[1]);
        const surrounding = text.substring(
          Math.max(0, match.index - 100),
          Math.min(text.length, match.index + 200)
        );

        // Try to find university name
        const uniPattern =
          /(?:Universidad|University|Instituto|Institute|Politécnica|School|College|Universitat)\s+(?:de\s+)?([^\n,]{3,60})/i;
        const uniMatch = surrounding.match(uniPattern);

        degrees.push({
          degree: this.cleanLine(match[0]),
          institution: uniMatch
            ? this.cleanLine(`${uniMatch[0]}`)
            : 'Institución',
          field: field || 'General',
          startDate: this.findYear(surrounding, -1) || '',
          endDate: this.findYear(surrounding, 1) || '',
        });
      }
    }

    return degrees.slice(0, 5);
  }

  // ── Languages ───────────────────────────────────────────

  private readonly LANGUAGE_LIST = [
    'Español', 'Spanish', 'Inglés', 'English', 'Francés', 'French',
    'Alemán', 'German', 'Portugués', 'Portuguese', 'Italiano', 'Italian',
    'Chino', 'Chinese', 'Mandarín', 'Mandarin', 'Japonés', 'Japanese',
    'Coreano', 'Korean', 'Árabe', 'Arabic', 'Ruso', 'Russian',
    'Catalán', 'Catalonian', 'Euskera', 'Basque', 'Gallego', 'Galician',
    'Holandés', 'Dutch', 'Sueco', 'Swedish', 'Polaco', 'Polish',
  ];

  private extractLanguages(text: string): string[] {
    const found = new Set<string>();
    for (const lang of this.LANGUAGE_LIST) {
      if (new RegExp(`\\b${lang}\\b`, 'i').test(text)) {
        // Normalize to Spanish name
        found.add(this.normalizeLanguage(lang));
      }
    }
    return found.size > 0 ? [...found] : ['Español'];
  }

  private normalizeLanguage(lang: string): string {
    const map: Record<string, string> = {
      spanish: 'Español', english: 'Inglés', french: 'Francés',
      german: 'Alemán', portuguese: 'Portugués', italian: 'Italiano',
      chinese: 'Chino', mandarin: 'Mandarín', japanese: 'Japonés',
      korean: 'Coreano', arabic: 'Árabe', russian: 'Ruso',
      catalonian: 'Catalán', basque: 'Euskera', galician: 'Gallego',
      dutch: 'Holandés', swedish: 'Sueco', polish: 'Polaco',
    };
    return map[lang.toLowerCase()] || lang;
  }

  // ── Summary ─────────────────────────────────────────────

  private extractSummary(text: string): string {
    const patterns = [
      /(?:Resumen|Summary|Perfil|Profile|About|Sobre\s+m[íi]|Acerca)\s*[:.\n]\s*([^\n]{20,300})/i,
      /(?:Objetivo|Objective)\s*[:.\n]\s*([^\n]{20,300})/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return this.cleanLine(match[1]);
    }
    return '';
  }

  // ── Headline Inference ──────────────────────────────────

  private inferHeadline(
    text: string,
    skills: string[],
    experience: Experience[]
  ): string {
    // Try to find a professional title in the text
    const titlePattern =
      /(?:Senior|Junior|Lead|Staff|Principal|Mid|Sr\.?|Jr\.?)\s+(?:Software|Frontend|Backend|Full[\s-]?Stack|DevOps|Cloud|Data|Mobile|Web|QA|ML|AI)\s+(?:Engineer|Developer|Architect|Manager|Analyst|Scientist|Designer)/i;
    const titleMatch = text.match(titlePattern);
    if (titleMatch) return titleMatch[0];

    // Infer from experience
    if (experience.length > 0) {
      return experience[0].title;
    }

    // Infer from skills
    if (skills.length > 0) {
      const topSkills = skills.slice(0, 3).join(', ');
      return `Desarrollador · ${topSkills}`;
    }

    return 'Profesional';
  }

  // ── Utilities ───────────────────────────────────────────

  private cleanLine(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/^[\s\-•·|:]+/, '')
      .trim();
  }

  private findYear(text: string, direction: number): string {
    const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => m[0]);
    if (years.length === 0) return '';
    return direction < 0 ? years[0] : years[years.length - 1];
  }
}
