import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserProfile } from '../models/profile.model';

interface ParseCvResponse {
  profile: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class AiCvParserService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:3333/api';

  /**
   * Parsea un CV usando el parser local directamente.
   * NOTA: El llamado a Gemini está desactivado por problemas de estabilidad.
   * @param text Texto plano extraído del CV
   * @param fileName Nombre original del archivo
   */
  async parseCv(text: string, fileName?: string): Promise<UserProfile> {
    // USAR PARSER LOCAL DIRECTAMENTE (más estable)
    console.log('[AiCvParser] Usando parser local');
    const { CvParserService } = await import('./cv-parser.service');
    const localParser = new CvParserService();
    return localParser.parseText(text, fileName || 'CV');

    /*
    // CÓDIGO GEMINI COMENTADO - Problemas con JSON malformado
    try {
      const response = await firstValueFrom(
        this.http.post<ParseCvResponse>(`${this.API_BASE}/cv/parse`, {
          text,
          fileName,
        })
      );
      return response.profile;
    } catch (error) {
      console.warn('[AiCvParser] Backend unavailable, using local parser:', error);
      const { CvParserService } = await import('./cv-parser.service');
      const localParser = new CvParserService();
      return localParser.parseText(text, fileName || 'CV');
    }
    */
  }
}
