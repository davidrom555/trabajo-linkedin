import { Injectable, inject, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { UserProfile } from '../models/profile.model';
import { CvParserService } from './cv-parser.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly cvParser = inject(CvParserService);
  private readonly STORAGE_KEY = 'smartjob_profile';
  private parserWorker: Worker | null = null;

  private readonly _profile = signal<UserProfile | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _rawCvText = signal<string>('');

  readonly profile = this._profile.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasProfile = computed(() => this._profile() !== null);
  readonly rawCvText = this._rawCvText.asReadonly();

  constructor() {
    // Load profile from localStorage on init
    this.loadProfileFromStorage();
    // Initialize Web Worker if supported
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      if (typeof Worker !== 'undefined') {
        this.parserWorker = new Worker(
          new URL('./cv-parser.worker', import.meta.url),
          { type: 'module' }
        );
      }
    } catch (err) {
      console.warn('[ProfileService] Web Worker initialization failed, falling back to main thread:', err);
      this.parserWorker = null;
    }
  }

  readonly profileCompleteness = computed(() => {
    const p = this._profile();
    if (!p) return 0;
    let score = 0;
    if (p.fullName && p.fullName !== 'Usuario') score += 15;
    if (p.headline) score += 15;
    if (p.summary) score += 15;
    if (p.skills.length > 0) score += 20;
    if (p.experience.length > 0) score += 20;
    if (p.education.length > 0) score += 10;
    if (p.location) score += 5;
    return Math.min(score, 100);
  });

  /** Upload and parse a CV file - works on both web and native */
  async uploadCv(file: File): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Save to native filesystem if on mobile
      if (this.isNative()) {
        await this.saveToNativeFs(file);
      }

      // Parse the CV using Web Worker if available, otherwise fallback to main thread
      const profile = this.parserWorker
        ? await this.parseWithWorker(file)
        : await this.cvParser.parseFile(file);

      console.log('[ProfileService] Parsed profile:', profile);
      console.log('[ProfileService] Skills found:', profile.skills);
      console.log('[ProfileService] Experience entries:', profile.experience.length);

      this._profile.set(profile);
      this.saveProfileToStorage();
      console.log('[ProfileService] Profile saved:', profile.fullName);
    } catch (err) {
      console.error('[ProfileService] CV parsing failed:', err);
      this._error.set(
        'Error al procesar el CV. Asegúrate de que sea un PDF válido.'
      );
    } finally {
      this._isLoading.set(false);
    }
  }

  private parseWithWorker(file: File): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
      if (!this.parserWorker) {
        reject(new Error('Web Worker not available'));
        return;
      }

      const handleMessage = ({ data }: MessageEvent) => {
        this.parserWorker!.removeEventListener('message', handleMessage);
        this.parserWorker!.removeEventListener('error', handleError);

        if (data.success) {
          resolve(data.data);
        } else {
          reject(new Error(data.error));
        }
      };

      const handleError = (err: ErrorEvent) => {
        this.parserWorker!.removeEventListener('message', handleMessage);
        this.parserWorker!.removeEventListener('error', handleError);
        reject(new Error(`Web Worker error: ${err.message}`));
      };

      this.parserWorker.addEventListener('message', handleMessage);
      this.parserWorker.addEventListener('error', handleError);

      file.arrayBuffer().then(buffer => {
        this.parserWorker!.postMessage({
          file: {
            data: buffer,
            name: file.name,
            type: file.type
          }
        });
      }).catch(reject);
    });
  }

  updateProfile(partial: Partial<UserProfile>): void {
    const current = this._profile();
    if (current) {
      this._profile.set({ ...current, ...partial });
      this.saveProfileToStorage();
    }
  }

  /** Manually set skills (useful when PDF parsing misses some) */
  addSkills(newSkills: string[]): void {
    const current = this._profile();
    if (current) {
      const merged = [...new Set([...current.skills, ...newSkills])];
      this._profile.set({ ...current, skills: merged });
      this.saveProfileToStorage();
    }
  }

  clearProfile(): void {
    this._profile.set(null);
    this._rawCvText.set('');
    this.saveProfileToStorage();
  }

  /** Save profile to localStorage */
  private saveProfileToStorage(): void {
    try {
      const profile = this._profile();
      if (profile) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profile));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[ProfileService] Failed to save profile:', err);
    }
  }

  /** Load profile from localStorage */
  private loadProfileFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        // Restore Date objects
        if (profile.cvUploadedAt) {
          profile.cvUploadedAt = new Date(profile.cvUploadedAt);
        }
        this._profile.set(profile);
        console.log('[ProfileService] Profile loaded from storage:', profile.fullName);
      }
    } catch (err) {
      console.warn('[ProfileService] Failed to load profile:', err);
    }
  }

  /** Check if running on native platform (safe for web) */
  private isNative(): boolean {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  /** Save file to device filesystem (native only) */
  private async saveToNativeFs(file: File): Promise<void> {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const base64 = await this.fileToBase64(file);
      await Filesystem.writeFile({
        path: `smartjob-cv/${file.name}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (err) {
      console.warn('[ProfileService] Native FS save failed (expected on web):', err);
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
