// FASE 1 y 2: Mejoras al CV Parser Service
// Estos métodos deben ser agregados al cv-parser.service.ts

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
    // More flexible pattern that captures everything after header
    const sectionRegex = new RegExp(
      `(?:^|\\n)\\s*(?:${patternStr})\\s*[:–\\-]?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:${sectionPatterns.map(s => s.patterns.join('|')).join('|')})\\s*[:–\\-]|$)`,
      'im'
    );

    const match = sectionRegex.exec(text);
    if (match && match[1]) {
      sections.set(key, match[1].trim());
    }
  }

  return sections;
}

// ── FASE 2: Enhanced Skills Extraction ──────────────────

/** Parse skills section and extract individual skills */
private parseSkillsSection(skillsText: string): string[] {
  // Split by common delimiters: comma, newline, bullet, dash, etc.
  const skills = skillsText
    .split(/[,\n•·\-|\/]/)
    .map(s => s.trim())
    .filter(s => {
      // Valid if: 2-60 chars, not pure numbers, not email
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
  // Match capitalized tech names: React, Node.js, AWS, Docker, etc.
  const techPattern = /\b([A-Z][a-zA-Z0-9.\-+#]*(?:\.[a-zA-Z0-9.\-+#]*)?)\b(?=\s*[,.\)])/g;
  const matches = experienceText.match(techPattern) || [];

  // Filter valid tech
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
    'as', 'so', 'this', 'that', 'these', 'those',
  ];

  return skills.filter(
    s =>
      !stopwords.includes(s.toLowerCase()) &&
      s.length > 2 &&
      !/^\d/.test(s) &&
      !s.includes('http')
  );
}

// REEMPLAZAR el método extractSkills() ACTUAL con este:
// (El método actual busca solo en skillSectionMatch)
//
// Nuevo código:
// private extractSkills(text: string): string[] {
//   const found = new Set<string>();
//   const sections = this.findSections(text);
//
//   // PASO 1: Extract predefined skills from all text
//   for (const { pattern, skill } of this.SKILL_PATTERNS) {
//     if (pattern.test(text)) {
//       found.add(skill);
//     }
//   }
//
//   // PASO 2: Extract custom skills from "skills" section
//   const skillsSection = sections.get('skills');
//   if (skillsSection) {
//     const customSkills = this.parseSkillsSection(skillsSection);
//     customSkills.forEach(s => found.add(s));
//   }
//
//   // PASO 3: Extract technologies mentioned in experience section
//   const expSection = sections.get('experience');
//   if (expSection) {
//     const techFromExperience = this.extractTechFromExperience(expSection);
//     techFromExperience.forEach(t => found.add(t));
//   }
//
//   // PASO 4: Filter stopwords and invalid entries
//   const filtered = this.filterStopwords(Array.from(found));
//
//   return filtered.sort();
// }
