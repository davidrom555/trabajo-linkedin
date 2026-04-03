import { TestBed } from '@angular/core/testing';
import { JobService } from './job.service';
import { LinkedInApiService } from './linkedin-api.service';
import { ProfileService } from './profile.service';
import { Job, TimeFilter } from '../models/job.model';
import { UserProfile } from '../models/profile.model';

describe('JobService', () => {
  let service: JobService;
  let linkedinApiService: jasmine.SpyObj<LinkedInApiService>;
  let profileService: jasmine.SpyObj<ProfileService>;

  const mockJob: Job = {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'USA',
    remote: 'remote',
    salary: { min: 100000, max: 150000, currency: 'USD' },
    description: 'We are looking for a frontend developer',
    requirements: ['JavaScript', 'React', 'TypeScript'],
    postedAt: new Date(),
    linkedinUrl: 'https://example.com/job/1',
    source: 'adzuna',
    matchScore: 85,
    matchBreakdown: {
      skillsMatch: 100,
      experienceMatch: 80,
      locationMatch: 70,
      seniorityMatch: 75,
    },
    saved: false,
    applied: false,
  };

  const mockProfile: UserProfile = {
    id: '1',
    fullName: 'John Developer',
    headline: 'Senior Frontend Developer',
    summary: 'Experienced frontend developer',
    skills: ['JavaScript', 'React', 'TypeScript', 'Angular'],
    experience: [],
    education: [],
    languages: ['English', 'Spanish'],
    location: 'USA',
  };

  beforeEach(() => {
    const linkedinSpy = jasmine.createSpyObj('LinkedInApiService', [
      'fetchJobs',
      'healthCheck',
      'clearServerCache',
    ]);
    const profileSpy = jasmine.createSpyObj('ProfileService', [
      'getProfile',
    ]);

    TestBed.configureTestingModule({
      providers: [
        JobService,
        { provide: LinkedInApiService, useValue: linkedinSpy },
        { provide: ProfileService, useValue: profileSpy },
      ],
    });

    service = TestBed.inject(JobService);
    linkedinApiService = TestBed.inject(
      LinkedInApiService
    ) as jasmine.SpyObj<LinkedInApiService>;
    profileService = TestBed.inject(
      ProfileService
    ) as jasmine.SpyObj<ProfileService>;
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default filters', () => {
      expect(service.timeFilter()).toBe('7d');
      expect(service.remoteOnly()).toBe(false);
      expect(service.minSalary()).toBeNull();
      expect(service.location()).toBe('');
    });

    it('should load jobs on initialization', async () => {
      linkedinApiService.fetchJobs.and.returnValue(
        Promise.resolve([mockJob])
      );

      await service.loadJobs();

      expect(linkedinApiService.fetchJobs).toHaveBeenCalled();
    });
  });

  describe('filter operations', () => {
    it('should set search query', () => {
      service.setSearchQuery('react');
      expect(service.searchQuery()).toBe('react');
    });

    it('should set time filter', () => {
      service.setTimeFilter('24h');
      expect(service.timeFilter()).toBe('24h');
    });

    it('should set remote only filter', () => {
      service.setRemoteOnly(true);
      expect(service.remoteOnly()).toBe(true);
    });

    it('should set minimum salary', () => {
      service.setMinSalary(100000);
      expect(service.minSalary()).toBe(100000);
    });

    it('should set location', () => {
      service.setLocation('USA');
      expect(service.location()).toBe('USA');
    });

    it('should set selected sources', () => {
      service.setSelectedSources(['adzuna', 'linkedin']);
      expect(service.selectedSources()).toContain('adzuna');
      expect(service.selectedSources()).toContain('linkedin');
    });
  });

  describe('job operations', () => {
    beforeEach(() => {
      service._jobs.set([mockJob]);
    });

    it('should toggle saved status', () => {
      expect(mockJob.saved).toBe(false);

      service.toggleSaved(mockJob.id);

      const updatedJob = service.jobs()[0];
      expect(updatedJob.saved).toBe(true);
    });

    it('should mark job as applied', () => {
      expect(mockJob.applied).toBe(false);

      service.markApplied(mockJob.id);

      const updatedJob = service.jobs()[0];
      expect(updatedJob.applied).toBe(true);
    });

    it('should dismiss job', () => {
      expect(service.jobs().length).toBe(1);

      service.dismissJob(mockJob.id);

      expect(service.jobs().length).toBe(0);
    });
  });

  describe('matching algorithm', () => {
    it('should calculate match score for job with profile', () => {
      profileService.profile.and.returnValue(mockProfile);
      service._jobs.set([mockJob]);

      const jobs = service.jobs();

      expect(jobs[0].matchScore).toBeGreaterThanOrEqual(0);
      expect(jobs[0].matchScore).toBeLessThanOrEqual(100);
    });

    it('should have proper match breakdown', () => {
      profileService.profile.and.returnValue(mockProfile);
      service._jobs.set([mockJob]);

      const jobs = service.jobs();
      const breakdown = jobs[0].matchBreakdown;

      expect(breakdown.skillsMatch).toBeGreaterThanOrEqual(0);
      expect(breakdown.experienceMatch).toBeGreaterThanOrEqual(0);
      expect(breakdown.locationMatch).toBeGreaterThanOrEqual(0);
      expect(breakdown.seniorityMatch).toBeGreaterThanOrEqual(0);
    });

    it('should prioritize skills matching', () => {
      const jobWithSkills: Job = {
        ...mockJob,
        requirements: ['JavaScript', 'React', 'TypeScript'],
      };

      profileService.profile.and.returnValue(mockProfile);
      service._jobs.set([jobWithSkills]);

      const jobs = service.jobs();

      // Skills match should be high since all required skills are in profile
      expect(jobs[0].matchBreakdown.skillsMatch).toBeGreaterThan(50);
    });
  });

  describe('filtering', () => {
    beforeEach(() => {
      service._jobs.set([
        mockJob,
        {
          ...mockJob,
          id: '2',
          remote: 'onsite',
          location: 'Spain',
        },
      ]);
    });

    it('should filter by remote only', () => {
      service.setRemoteOnly(true);

      const filtered = service.filteredJobs();

      expect(filtered.length).toBe(1);
      expect(filtered[0].remote).toBe('remote');
    });

    it('should filter by search query', () => {
      service.setSearchQuery('Frontend');

      const filtered = service.filteredJobs();

      expect(filtered.length).toBeGreaterThan(0);
      expect(
        filtered[0].title.toLowerCase().includes('frontend')
      ).toBe(true);
    });

    it('should filter by location', () => {
      service.setLocation('Spain');

      const filtered = service.filteredJobs();

      expect(filtered.some((j) => j.location === 'Spain')).toBe(true);
    });

    it('should combine multiple filters', () => {
      service.setRemoteOnly(true);
      service.setMinSalary(100000);

      const filtered = service.filteredJobs();

      filtered.forEach((job) => {
        expect(job.remote).toBe('remote');
        if (job.salary) {
          expect(job.salary.min).toBeGreaterThanOrEqual(100000);
        }
      });
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      service._jobs.set([
        { ...mockJob, matchScore: 90 },
        { ...mockJob, id: '2', matchScore: 75 },
        { ...mockJob, id: '3', matchScore: 85, remote: 'onsite' },
      ]);
    });

    it('should calculate correct total count', () => {
      expect(service.stats().total).toBe(3);
    });

    it('should find highest match score', () => {
      const stats = service.stats();
      expect(stats.highMatch).toBe(90);
    });

    it('should calculate average score correctly', () => {
      const stats = service.stats();
      const expectedAvg = (90 + 75 + 85) / 3;
      expect(stats.avgScore).toBeCloseTo(expectedAvg, 1);
    });

    it('should count remote jobs correctly', () => {
      const stats = service.stats();
      expect(stats.remoteCount).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should set error when job loading fails', async () => {
      linkedinApiService.fetchJobs.and.returnValue(
        Promise.reject(new Error('API Error'))
      );

      try {
        await service.loadJobs();
      } catch {
        // Error expected
      }

      expect(service.error()).toBeTruthy();
    });

    it('should clear error', () => {
      service._error.set('Some error');
      expect(service.error()).toBeTruthy();

      service.clearError();

      expect(service.error()).toBeNull();
    });
  });

  describe('saved jobs', () => {
    it('should retrieve saved jobs', () => {
      service._jobs.set([
        { ...mockJob, saved: true },
        { ...mockJob, id: '2', saved: false },
      ]);

      const saved = service.savedJobs();

      expect(saved.length).toBe(1);
      expect(saved[0].saved).toBe(true);
    });

    it('should persist saved jobs to localStorage', () => {
      service.toggleSaved(mockJob.id);

      const savedIds = JSON.parse(
        localStorage.getItem('smartjob:saved_jobs') || '[]'
      );

      expect(savedIds).toContain(mockJob.id);
    });
  });
});
