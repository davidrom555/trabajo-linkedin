import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  flagEmoji: string;
  flagUrl: string; // SVG from countryflagsapi.com
}

interface RestCountriesData {
  cca2: string;
  name: { common: string };
  region: string;
  flags: { svg: string; png: string };
}

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private readonly http = inject(HttpClient);
  private readonly _countries = signal<Country[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly countries = this._countries.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly countriesByRegion = computed(() => {
    const grouped = new Map<string, Country[]>();
    const regions = ['Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];

    for (const region of regions) {
      const items = this._countries().filter((c) => c.region === region);
      if (items.length > 0) {
        grouped.set(region, items);
      }
    }

    return grouped;
  });

  async loadCountries(): Promise<void> {
    if (this._countries().length > 0) {
      return; // Ya están cargados
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.http.get<RestCountriesData[]>('https://restcountries.com/v3.1/all')
      );

      console.log('[CountriesService] ✓ Países cargados:', response.length);

      const countries: Country[] = response
        .map((data) => ({
          code: data.cca2,
          name: data.name.common,
          region: data.region || 'Other',
          flagEmoji: this.getFlagEmoji(data.cca2),
          flagUrl: data.flags.svg,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      this._countries.set(countries);
    } catch (error) {
      console.error('[CountriesService] Error cargando países:', error);
      this._error.set('Error cargando países');
      // Fallback a países precargados
      this._setFallbackCountries();
    } finally {
      this._isLoading.set(false);
    }
  }

  private getFlagEmoji(countryCode: string): string {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  private _setFallbackCountries(): void {
    const fallback: Country[] = [
      // Europa
      { code: 'ES', name: 'España', region: 'Europe', flagEmoji: '🇪🇸', flagUrl: 'https://flagcdn.com/es.svg' },
      { code: 'GB', name: 'Reino Unido', region: 'Europe', flagEmoji: '🇬🇧', flagUrl: 'https://flagcdn.com/gb.svg' },
      { code: 'DE', name: 'Alemania', region: 'Europe', flagEmoji: '🇩🇪', flagUrl: 'https://flagcdn.com/de.svg' },
      { code: 'FR', name: 'Francia', region: 'Europe', flagEmoji: '🇫🇷', flagUrl: 'https://flagcdn.com/fr.svg' },
      { code: 'IT', name: 'Italia', region: 'Europe', flagEmoji: '🇮🇹', flagUrl: 'https://flagcdn.com/it.svg' },
      { code: 'PT', name: 'Portugal', region: 'Europe', flagEmoji: '🇵🇹', flagUrl: 'https://flagcdn.com/pt.svg' },
      { code: 'NL', name: 'Países Bajos', region: 'Europe', flagEmoji: '🇳🇱', flagUrl: 'https://flagcdn.com/nl.svg' },

      // Americas
      { code: 'US', name: 'Estados Unidos', region: 'Americas', flagEmoji: '🇺🇸', flagUrl: 'https://flagcdn.com/us.svg' },
      { code: 'CA', name: 'Canadá', region: 'Americas', flagEmoji: '🇨🇦', flagUrl: 'https://flagcdn.com/ca.svg' },
      { code: 'MX', name: 'México', region: 'Americas', flagEmoji: '🇲🇽', flagUrl: 'https://flagcdn.com/mx.svg' },
      { code: 'BR', name: 'Brasil', region: 'Americas', flagEmoji: '🇧🇷', flagUrl: 'https://flagcdn.com/br.svg' },
      { code: 'AR', name: 'Argentina', region: 'Americas', flagEmoji: '🇦🇷', flagUrl: 'https://flagcdn.com/ar.svg' },
      { code: 'CL', name: 'Chile', region: 'Americas', flagEmoji: '🇨🇱', flagUrl: 'https://flagcdn.com/cl.svg' },
      { code: 'CO', name: 'Colombia', region: 'Americas', flagEmoji: '🇨🇴', flagUrl: 'https://flagcdn.com/co.svg' },

      // Asia
      { code: 'IN', name: 'India', region: 'Asia', flagEmoji: '🇮🇳', flagUrl: 'https://flagcdn.com/in.svg' },
      { code: 'JP', name: 'Japón', region: 'Asia', flagEmoji: '🇯🇵', flagUrl: 'https://flagcdn.com/jp.svg' },
      { code: 'SG', name: 'Singapur', region: 'Asia', flagEmoji: '🇸🇬', flagUrl: 'https://flagcdn.com/sg.svg' },
    ];

    this._countries.set(fallback);
  }

  getCountryByCode(code: string): Country | undefined {
    return this._countries().find((c) => c.code === code.toUpperCase());
  }

  searchCountries(query: string): Country[] {
    const search = query.toLowerCase();
    return this._countries().filter(
      (c) =>
        c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search)
    );
  }
}
