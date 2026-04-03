import { TestBed } from '@angular/core/testing';
import { CvParserService } from './cv-parser.service';

describe('CvParserService', () => {
  let service: CvParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CvParserService],
    });
    service = TestBed.inject(CvParserService);
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('email extraction', () => {
    it('should extract valid email', () => {
      const text = 'Contact me at john.doe@example.com for more info';
      const email = (service as any).extractEmail(text);

      expect(email).toBe('john.doe@example.com');
    });

    it('should return empty string if no email found', () => {
      const text = 'No email in this text';
      const email = (service as any).extractEmail(text);

      expect(email).toBe('');
    });

    it('should extract email with numbers', () => {
      const text = 'Email: dev2024@tech.co';
      const email = (service as any).extractEmail(text);

      expect(email).toBe('dev2024@tech.co');
    });
  });

  describe('phone extraction', () => {
    it('should extract phone number', () => {
      const text = 'Call me at +1 (555) 123-4567';
      const phone = (service as any).extractPhone(text);

      expect(phone).toBeTruthy();
      expect(phone).toContain('555');
    });

    it('should extract phone without country code', () => {
      const text = 'Tel: 555-1234';
      const phone = (service as any).extractPhone(text);

      expect(phone).toBeTruthy();
    });

    it('should return empty if no phone found', () => {
      const text = 'No phone number here';
      const phone = (service as any).extractPhone(text);

      expect(phone).toBe('');
    });
  });

  describe('name extraction', () => {
    it('should extract name from "Nombre:" pattern', () => {
      const text = 'Nombre: John Smith';
      const name = (service as any).extractName(text);

      expect(name).toBe('John Smith');
    });

    it('should extract name from "Name:" pattern', () => {
      const text = 'Name: Jane Doe';
      const name = (service as any).extractName(text);

      expect(name).toBe('Jane Doe');
    });

    it('should extract capitalized name from first lines', () => {
      const text = 'John Smith Developer\nemail@example.com';
      const name = (service as any).extractName(text);

      expect(name).toBeTruthy();
      expect(name.toLowerCase()).toContain('john');
    });

    it('should handle all-caps names', () => {
      const text = 'JUAN GARCÍA López';
      const name = (service as any).extractName(text);

      expect(name).toBeTruthy();
    });
  });

  describe('skill extraction', () => {
    it('should detect JavaScript', () => {
      const text = 'Experienced in JavaScript and React';
      const skills = (service as any).extractSkills(text);

      expect(skills).toContain('JavaScript');
    });

    it('should detect TypeScript', () => {
      const text = 'Skills: TypeScript, Node.js, Express';
      const skills = (service as any).extractSkills(text);

      expect(skills).toContain('TypeScript');
    });

    it('should detect React', () => {
      const text = 'Frontend: React, Angular, Vue.js';
      const skills = (service as any).extractSkills(text);

      expect(skills).toContain('React');
    });

    it('should detect multiple frameworks', () => {
      const text = 'React, Angular, Vue.js, Node.js';
      const skills = (service as any).extractSkills(text);

      expect(skills.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle case insensitive matching', () => {
      const text = 'javascript, react, angular';
      const skills = (service as any).extractSkills(text);

      expect(skills).toContain('JavaScript');
      expect(skills).toContain('React');
      expect(skills).toContain('Angular');
    });

    it('should not duplicate skills', () => {
      const text = 'JavaScript JavaScript JavaScript';
      const skills = (service as any).extractSkills(text);

      const jsCount = skills.filter((s) => s === 'JavaScript').length;
      expect(jsCount).toBe(1);
    });
  });

  describe('location extraction', () => {
    it('should detect Madrid', () => {
      const text = 'Located in Madrid, Spain';
      const location = (service as any).extractLocation(text);

      expect(location).toBe('Madrid');
    });

    it('should detect London', () => {
      const text = 'Based in London, UK';
      const location = (service as any).extractLocation(text);

      expect(location).toBe('London');
    });

    it('should detect Remote', () => {
      const text = 'Remote position available';
      const location = (service as any).extractLocation(text);

      expect(location).toBe('Remote');
    });

    it('should return empty if no known location found', () => {
      const text = 'Located in Unknown City';
      const location = (service as any).extractLocation(text);

      expect(location).toBe('');
    });
  });

  describe('language extraction', () => {
    it('should detect Español', () => {
      const text = 'Idiomas: Español, Inglés';
      const languages = (service as any).extractLanguages(text);

      expect(languages).toContain('Español');
    });

    it('should detect Inglés', () => {
      const text = 'Languages: English, Spanish';
      const languages = (service as any).extractLanguages(text);

      expect(languages).toContain('Inglés');
    });

    it('should default to Español if no languages found', () => {
      const text = 'No languages section';
      const languages = (service as any).extractLanguages(text);

      expect(languages).toContain('Español');
    });

    it('should detect multiple languages', () => {
      const text = 'Francés, Alemán, Portugués, Español';
      const languages = (service as any).extractLanguages(text);

      expect(languages.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('summary extraction', () => {
    it('should extract from "Resumen:" pattern', () => {
      const text = 'Resumen: Experienced developer with 10 years of experience';
      const summary = (service as any).extractSummary(text);

      expect(summary).toContain('Experienced developer');
    });

    it('should extract from "Summary:" pattern', () => {
      const text = 'Summary: Full stack engineer proficient in modern technologies';
      const summary = (service as any).extractSummary(text);

      expect(summary).toContain('Full stack');
    });

    it('should extract from "Perfil:" pattern', () => {
      const text = 'Perfil: Desarrollador con pasión por la tecnología';
      const summary = (service as any).extractSummary(text);

      expect(summary).toContain('Desarrollador');
    });

    it('should return empty if no summary pattern found', () => {
      const text = 'Some random text without summary';
      const summary = (service as any).extractSummary(text);

      expect(summary).toBe('');
    });

    it('should require minimum length for summary', () => {
      const text = 'Resumen: Dev'; // Too short
      const summary = (service as any).extractSummary(text);

      // Should not match because pattern expects 50+ characters
      expect(summary).toBe('');
    });
  });

  describe('text cleaning', () => {
    it('should clean carriage returns', () => {
      const text = 'Line1\r\nLine2\r\nLine3';
      const cleaned = (service as any).cleanText(text);

      expect(cleaned).toContain('Line1');
      expect(cleaned).toContain('Line2');
      expect(cleaned.includes('\r')).toBe(false);
    });

    it('should remove multiple spaces', () => {
      const text = 'Multiple   spaces   here';
      const cleaned = (service as any).cleanText(text);

      expect(cleaned).toBe('Multiple spaces here');
    });

    it('should handle tabs', () => {
      const text = 'Text\twith\ttabs';
      const cleaned = (service as any).cleanText(text);

      expect(cleaned).toContain('Text');
      expect(cleaned.includes('\t')).toBe(false);
    });
  });

  describe('full profile parsing', () => {
    it('should create valid profile from text', () => {
      const text = `
        Nombre: John Developer
        Email: john@example.com
        Phone: +1-555-1234

        Resumen: Software engineer with 5 years of experience

        Skills:
        JavaScript, React, TypeScript, Node.js, HTML, CSS

        Languages: English, Spanish

        Experience:
        Senior Developer at TechCorp
        2020 - 2024

        Education:
        Bachelor of Science in Computer Science
        University of Technology
      `;

      const profile = (service as any).parseText(text, 'cv.txt');

      expect(profile.fullName).toBeTruthy();
      expect(profile.email).toBe('john@example.com');
      expect(profile.skills.length).toBeGreaterThan(0);
      expect(profile.languages.length).toBeGreaterThan(0);
      expect(profile.summary).toBeTruthy();
    });

    it('should handle missing fields gracefully', () => {
      const text = 'Minimal CV\nJohn Doe\nDeveloper';

      const profile = (service as any).parseText(text, 'cv.txt');

      expect(profile.fullName).toBeTruthy();
      expect(profile.id).toBeTruthy();
      expect(profile.cvFileName).toBe('cv.txt');
    });

    it('should extract experience with dates', () => {
      const text = `
        Experience:
        Developer at Company A
        2020 - 2023

        Developer at Company B
        2023 - Present
      `;

      const profile = (service as any).parseText(text, 'cv.txt');

      expect(profile.experience.length).toBeGreaterThan(0);
    });

    it('should extract education', () => {
      const text = `
        Education:
        Bachelor of Science en Computer Science
        Master en Software Engineering
      `;

      const profile = (service as any).parseText(text, 'cv.txt');

      expect(profile.education.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle empty text gracefully', () => {
      const profile = (service as any).parseText('', 'empty.txt');

      expect(profile).toBeTruthy();
      expect(profile.fullName).toBe('Usuario');
    });

    it('should set default summary when not found', () => {
      const text = 'Name: John Developer';
      const profile = (service as any).parseText(text, 'cv.txt');

      expect(profile.summary).toBeTruthy();
      expect(profile.summary.toLowerCase()).toContain('profesional');
    });

    it('should assign unique ID to each profile', () => {
      const text = 'Same text';
      const profile1 = (service as any).parseText(text, 'cv1.txt');
      const profile2 = (service as any).parseText(text, 'cv2.txt');

      expect(profile1.id).not.toBe(profile2.id);
    });
  });
});
