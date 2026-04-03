require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '';
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// ═══════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════

app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201', 'http://127.0.0.1:4200', 'http://127.0.0.1:4201'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// ── Validate API Keys on startup ──────────────────────────
console.log('\n  🔑 Verificando configuración de APIs...\n');

const hasAdzuna = ADZUNA_APP_ID && ADZUNA_APP_ID !== 'tu_app_id' && 
                  ADZUNA_APP_KEY && ADZUNA_APP_KEY !== 'tu_app_key';
const hasRapidApi = RAPIDAPI_KEY && RAPIDAPI_KEY !== 'tu_api_key_aqui';
const hasGemini = GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && GEMINI_API_KEY !== 'tu_api_key_aqui';

if (!hasAdzuna) {
  console.warn('  ⚠️  ADZUNA_API: No configurada');
  console.warn('     → Ve a https://developer.adzuna.com/');
  console.warn('     → Crea cuenta gratuita (5,000 req/mes)');
} else {
  console.log('  ✓ ADZUNA_API: CONFIGURADA');
}

if (!hasRapidApi) {
  console.warn('  ⚠️  RAPIDAPI_KEY: No configurada (opcional)');
} else {
  console.log('  ✓ RAPIDAPI_KEY: CONFIGURADA');
}

if (!hasGemini) {
  console.warn('  ⚠️  GEMINI_API_KEY: No configurada (opcional)');
  console.warn('     → Ve a https://aistudio.google.com/app/apikey');
  console.warn('     → Crea cuenta gratuita y genera API key');
} else {
  console.log('  ✓ GEMINI_API_KEY: CONFIGURADA');
}

console.log('');

// ═══════════════════════════════════════════════════════════
// CACHÉ EN MEMORIA
// ═══════════════════════════════════════════════════════════

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCacheKey(query, location, page, source) {
  return `${query.toLowerCase().trim()}_${location.toLowerCase().trim()}_${page}_${source}`;
}

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ═══════════════════════════════════════════════════════════
// SKILLS Y UTILIDADES
// ═══════════════════════════════════════════════════════════

const KNOWN_SKILLS = [
  // Lenguajes de programación
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Golang', 'Rust', 'Ruby', 'PHP', 
  'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'Dart', 'Objective-C', 'Perl', 'Lua', 'Shell', 'Bash',
  // Frontend
  'React', 'React.js', 'Angular', 'Vue', 'Vue.js', 'Svelte', 'Next.js', 'Nuxt', 'Nuxt.js',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'SCSS', 'Sass', 'Less', 'Tailwind', 'Tailwind CSS', 'Bootstrap',
  'Material UI', 'MUI', 'Chakra UI', 'Ant Design', 'jQuery', 'Redux', 'Zustand', 'MobX',
  // Backend
  'Node.js', 'Node', 'Express', 'Express.js', 'NestJS', 'Django', 'Flask', 'FastAPI', 
  'Spring', 'Spring Boot', 'Laravel', 'Symfony', '.NET', 'Rails', 'Ruby on Rails',
  'ASP.NET', 'GraphQL', 'REST', 'REST API', 'gRPC', 'WebSocket', 'Socket.io',
  // Cloud & DevOps
  'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 
  'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI',
  'Ansible', 'Puppet', 'Chef', 'Vagrant', 'Prometheus', 'Grafana', 'ELK Stack', 'Nginx', 'Apache',
  // Bases de datos
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 
  'SQLite', 'Cassandra', 'CouchDB', 'Firebase', 'Supabase', 'Prisma', 'TypeORM', 'Sequelize',
  'Mongoose', 'Hibernate', 'SQL', 'NoSQL', 'Oracle', 'SQL Server', 'MariaDB',
  // Data & ML
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn',
  'Pandas', 'NumPy', 'SciPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Spark', 'Apache Spark',
  'Kafka', 'Apache Kafka', 'Airflow', 'Apache Airflow', 'Hadoop', 'Databricks',
  // Mobile
  'React Native', 'Flutter', 'Ionic', 'Capacitor', 'Cordova', 'Xamarin', 'SwiftUI', 
  'Jetpack Compose', 'Android', 'iOS',
  // Testing
  'Jest', 'Mocha', 'Chai', 'Cypress', 'Playwright', 'Selenium', 'JUnit', 'PyTest', 
  'Vitest', 'Testing Library', 'Enzyme', 'Karma', 'Jasmine',
  // Herramientas
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Linux', 'Unix', 'Agile', 'Scrum', 'Kanban',
  'Jira', 'Confluence', 'Trello', 'Asana', 'Notion', 'Slack', 'Teams', 'Figma', 'Sketch',
  'Adobe XD', 'InVision', 'Postman', 'Insomnia', 'Swagger', 'OpenAPI', 'LinkedIn',
];

function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractSkills(text) {
  const clean = stripHtml(text).toLowerCase();
  const found = new Set();
  for (const skill of KNOWN_SKILLS) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(clean)) {
      found.add(skill);
    }
  }
  return [...found].slice(0, 15);
}

function parseSalary(raw) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) return null;
  const numbers = raw.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return null;
  const vals = numbers.map((n) => parseInt(n.replace(/,/g, ''), 10)).filter(Boolean);
  if (vals.length === 0) return null;
  const currency = raw.includes('€') ? 'EUR' : raw.includes('£') ? 'GBP' : 'USD';
  return { min: Math.min(...vals), max: vals.length > 1 ? Math.max(...vals) : vals[0], currency };
}

function detectRemoteType(title, location, description = '') {
  const combined = `${title} ${location} ${description}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('remoto') || combined.includes('work from home')) return 'remote';
  if (combined.includes('hybrid') || combined.includes('híbrido') || combined.includes('hibrido')) return 'hybrid';
  return 'onsite';
}

function getCountryCode(location) {
  const locationLower = location.toLowerCase();
  const countryMap = {
    'es': ['spain', 'españa', 'madrid', 'barcelona', 'valencia', 'sevilla'],
    'gb': ['uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'england'],
    'us': ['usa', 'united states', 'america', 'new york', 'san francisco', 'los angeles'],
    'de': ['germany', 'alemania', 'berlin', 'munich', 'hamburg'],
    'fr': ['france', 'francia', 'paris', 'lyon', 'marseille'],
    'it': ['italy', 'italia', 'rome', 'milan', 'naples'],
    'pt': ['portugal', 'lisbon', 'lisboa', 'porto'],
    'nl': ['netherlands', 'holanda', 'amsterdam', 'rotterdam'],
    'ca': ['canada', 'toronto', 'vancouver', 'montreal'],
    'au': ['australia', 'sydney', 'melbourne', 'brisbane'],
  };
  
  for (const [code, keywords] of Object.entries(countryMap)) {
    if (keywords.some(k => locationLower.includes(k))) return code;
  }
  return 'es'; // Default to Spain
}

// ═══════════════════════════════════════════════════════════
// ADZUNA API - Integración Principal
// ═══════════════════════════════════════════════════════════

async function searchAdzunaJobs(query, location = '', page = 1, resultsPerPage = 20) {
  if (!hasAdzuna) {
    throw new Error('Adzuna API no configurada');
  }

  const country = getCountryCode(location);
  const where = location ? `&where=${encodeURIComponent(location)}` : '';
  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?` +
    `app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}` +
    `&what=${encodeURIComponent(query)}${where}` +
    `&results_per_page=${resultsPerPage}` +
    `&content-type=application/json`;

  console.log(`[Adzuna API] Searching: "${query}" in "${location || country.toUpperCase()}" (page ${page})`);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Adzuna API] Error ${response.status}:`, errorText);
    throw new Error(`Adzuna API responded ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const jobs = data.results || [];
  
  console.log(`[Adzuna API] ✓ ${jobs.length} jobs found`);
  
  return jobs.map(normalizeAdzunaJob);
}

function normalizeAdzunaJob(raw) {
  const description = stripHtml(raw.description || '');
  const companyName = raw.company?.display_name || 
                      raw.company_name || 
                      'Empresa no especificada';
  
  return {
    id: `adzuna-${raw.id}`,
    title: raw.title || 'Sin título',
    company: companyName,
    companyLogo: raw.company?.logo || raw.company_logo || null,
    location: raw.location?.display_name || raw.location || 'Ubicación no especificada',
    remote: detectRemoteType(raw.title || '', raw.location?.display_name || '', description),
    salary: raw.salary_min ? {
      min: Math.round(raw.salary_min),
      max: Math.round(raw.salary_max || raw.salary_min),
      currency: raw.salary_currency || 'EUR',
    } : null,
    description,
    requirements: extractSkills(description),
    postedAt: raw.created || raw.created_at || new Date().toISOString(),
    linkedinUrl: raw.redirect_url || raw.url || '',
    source: 'adzuna',
    category: raw.category?.label || 'General',
    contractType: raw.contract_type || 'unknown',
    contractTime: raw.contract_time || 'unknown',
    matchScore: 0,
    matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
    saved: false,
    applied: false,
  };
}

// ═══════════════════════════════════════════════════════════
// RAPIDAPI - LinkedIn & JSearch (Fallback)
// ═══════════════════════════════════════════════════════════

async function searchLinkedInJobs(query, location, page = 1) {
  if (!hasRapidApi) {
    throw new Error('RapidAPI no configurada');
  }

  const url = 'https://linkedin-jobs-search.p.rapidapi.com/';
  const body = {
    search_terms: query,
    location: location || 'Spain',
    page: String(page),
    fetch_full_text: 'yes',
  };

  console.log(`[LinkedIn API] Searching: "${query}" in "${location || 'Spain'}" (page ${page})`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'linkedin-jobs-search.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[LinkedIn API] Error ${response.status}:`, errorText);
    throw new Error(`LinkedIn API responded ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`[LinkedIn API] Got ${Array.isArray(data) ? data.length : 0} results`);

  const jobs = Array.isArray(data) ? data : (data.jobs || data.data || []);
  return jobs.map(normalizeLinkedInJob);
}

function normalizeLinkedInJob(raw) {
  const description = stripHtml(raw.job_description || raw.description || '');
  return {
    id: `linkedin-${raw.job_id || raw.id || Math.random().toString(36).slice(2)}`,
    title: raw.job_title || raw.title || 'Sin título',
    company: raw.company_name || raw.company || 'Empresa desconocida',
    companyLogo: raw.company_logo || raw.thumbnail || null,
    location: raw.job_location || raw.location || 'Ubicación no especificada',
    remote: detectRemoteType(raw.job_title || '', raw.job_location || '', description),
    salary: parseSalary(raw.salary || raw.job_salary || ''),
    description,
    requirements: extractSkills(description),
    postedAt: raw.posted_date || raw.job_posted_date || new Date().toISOString(),
    linkedinUrl: raw.job_url || raw.linkedin_job_url || raw.job_apply_link || '',
    source: 'linkedin',
    matchScore: 0,
    matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
    saved: false,
    applied: false,
  };
}

async function searchJSearchJobs(query, location, page = 1) {
  if (!hasRapidApi) {
    throw new Error('RapidAPI no configurada');
  }

  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', `${query} in ${location || 'Spain'}`);
  url.searchParams.set('page', String(page));
  url.searchParams.set('num_pages', '1');
  url.searchParams.set('date_posted', 'week');

  console.log(`[JSearch API] Searching: "${query}" in "${location || 'Spain'}"`);

  const response = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      'x-rapidapi-key': RAPIDAPI_KEY,
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`JSearch API responded ${response.status}`);
  }

  const data = await response.json();
  const jobs = data.data || [];

  return jobs.map((raw) => {
    const description = stripHtml(raw.job_description || '');
    return {
      id: `jsearch-${raw.job_id || Math.random().toString(36).slice(2)}`,
      title: raw.job_title || '',
      company: raw.employer_name || '',
      companyLogo: raw.employer_logo || null,
      location: raw.job_city ? `${raw.job_city}, ${raw.job_country}` : (raw.job_country || ''),
      remote: raw.job_is_remote ? 'remote' : 'onsite',
      salary: raw.job_min_salary ? {
        min: raw.job_min_salary,
        max: raw.job_max_salary || raw.job_min_salary,
        currency: raw.job_salary_currency || 'USD',
      } : null,
      description,
      requirements: extractSkills(description),
      postedAt: raw.job_posted_at_datetime_utc || new Date().toISOString(),
      linkedinUrl: raw.job_apply_link || raw.job_google_link || '',
      source: raw.job_publisher?.includes('LinkedIn') ? 'linkedin' : 'jsearch',
      matchScore: 0,
      matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
      saved: false,
      applied: false,
    };
  });
}

// ═══════════════════════════════════════════════════════════
// APIS PÚBLICAS - Remotive & Arbeitnow (Siempre disponibles)
// ═══════════════════════════════════════════════════════════

async function searchRemotiveJobs(query, limit = 20) {
  console.log(`[Remotive API] Searching: "${query}"`);
  
  const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=${limit}`, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Remotive API responded ${response.status}`);
  }

  const data = await response.json();
  console.log(`[Remotive API] ✓ ${data.jobs?.length || 0} results`);
  return (data.jobs || []).map(normalizeRemotiveJob);
}

function normalizeRemotiveJob(raw) {
  const description = stripHtml(raw.description || '');
  return {
    id: `remotive-${raw.id}`,
    title: raw.title || 'Sin título',
    company: raw.company_name || 'Empresa desconocida',
    companyLogo: raw.company_logo || null,
    location: raw.candidate_required_location || 'Remote',
    remote: 'remote',
    salary: parseSalary(raw.salary || ''),
    description,
    requirements: extractSkills(`${description} ${(raw.tags || []).join(' ')}`),
    postedAt: raw.publication_date || new Date().toISOString(),
    linkedinUrl: raw.url || '',
    source: 'remotive',
    matchScore: 0,
    matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
    saved: false,
    applied: false,
  };
}

async function searchArbeitnowJobs(query, location = '') {
  console.log(`[Arbeitnow API] Searching: "${query}" in "${location}"`);
  
  const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow API responded ${response.status}`);
  }

  const data = await response.json();
  let jobs = data.data || [];
  
  if (query && query !== 'developer') {
    const queryLower = query.toLowerCase();
    jobs = jobs.filter(job => 
      (job.title && job.title.toLowerCase().includes(queryLower)) ||
      (job.description && job.description.toLowerCase().includes(queryLower)) ||
      (job.tags && job.tags.some(tag => tag.toLowerCase().includes(queryLower)))
    );
  }
  
  if (location) {
    const locationLower = location.toLowerCase();
    jobs = jobs.filter(job => 
      job.location && job.location.toLowerCase().includes(locationLower)
    );
  }
  
  console.log(`[Arbeitnow API] ✓ ${jobs.length} filtered results`);
  return jobs.slice(0, 25).map(normalizeArbeitnowJob);
}

function normalizeArbeitnowJob(raw) {
  const description = stripHtml(raw.description || '');
  return {
    id: `arbeitnow-${raw.slug || Math.random().toString(36).slice(2, 11)}`,
    title: raw.title || 'Sin título',
    company: raw.company_name || 'Empresa desconocida',
    companyLogo: null,
    location: raw.location || 'Remote',
    remote: detectRemoteType(raw.title || '', raw.location || '', description),
    salary: null,
    description,
    requirements: extractSkills(description),
    postedAt: raw.created_at || new Date().toISOString(),
    linkedinUrl: raw.url || '',
    source: 'arbeitnow',
    matchScore: 0,
    matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
    saved: false,
    applied: false,
  };
}

// ═══════════════════════════════════════════════════════════
// RUTAS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/jobs/search?q=angular&location=Madrid&page=1&limit=25&sources=all
 * 
 * Fuentes disponibles: adzuna, linkedin, jsearch, remotive, arbeitnow, all
 */
app.get('/api/jobs/search', async (req, res) => {
  const query = req.query.q || 'developer';
  const location = req.query.location || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const sources = req.query.sources || 'all';

  console.log(`\n[/api/jobs/search] q="${query}" location="${location}" page=${page} sources=${sources}`);

  // Verificar caché
  const cacheKey = getCacheKey(query, location, page, sources);
  const cached = getCached(cacheKey);
  if (cached && !req.query.nocache) {
    console.log(`[Cache] ✓ Retornando resultados en caché`);
    return res.json({ jobs: cached, total: cached.length, source: 'cache', cached: true });
  }

  let allJobs = [];
  const errors = [];
  const sourceList = sources === 'all' 
    ? ['adzuna', 'remotive', 'arbeitnow', 'linkedin', 'jsearch']
    : sources.split(',');

  // Orden de prioridad basado en las fuentes solicitadas
  // Si se solicita LinkedIn específicamente, intentarlo primero
  
  // 1. LINKEDIN (si se solicita específicamente)
  if (sourceList.includes('linkedin')) {
    try {
      const jobs = await searchLinkedInJobs(query, location, page);
      allJobs.push(...jobs);
      console.log(`[LinkedIn] ✓ ${jobs.length} jobs found`);
    } catch (err) {
      console.warn(`[LinkedIn] ✗ ${err.message}`);
      errors.push({ source: 'linkedin', error: err.message });
    }
  }

  // 2. JSEARCH (si se solicita específicamente)
  if (sourceList.includes('jsearch')) {
    try {
      const jobs = await searchJSearchJobs(query, location, page);
      allJobs.push(...jobs);
      console.log(`[JSearch] ✓ ${jobs.length} jobs found`);
    } catch (err) {
      console.warn(`[JSearch] ✗ ${err.message}`);
      errors.push({ source: 'jsearch', error: err.message });
    }
  }

  // 3. ADZUNA (fuente principal para 'all')
  if (sourceList.includes('adzuna')) {
    try {
      const jobs = await searchAdzunaJobs(query, location, page, limit);
      allJobs.push(...jobs);
    } catch (err) {
      console.warn(`[Adzuna] ✗ ${err.message}`);
      errors.push({ source: 'adzuna', error: err.message });
    }
  }

  // 2. Remotive (trabajos remotos)
  if (sourceList.includes('remotive')) {
    try {
      const jobs = await searchRemotiveJobs(query, Math.min(limit, 20));
      allJobs.push(...jobs);
    } catch (err) {
      console.warn(`[Remotive] ✗ ${err.message}`);
      errors.push({ source: 'remotive', error: err.message });
    }
  }

  // 3. Arbeitnow (Europa)
  if (sourceList.includes('arbeitnow')) {
    try {
      const jobs = await searchArbeitnowJobs(query, location);
      allJobs.push(...jobs);
    } catch (err) {
      console.warn(`[Arbeitnow] ✗ ${err.message}`);
      errors.push({ source: 'arbeitnow', error: err.message });
    }
  }

  // Si no hay resultados y hay errores, devolver error
  if (allJobs.length === 0 && errors.length > 0) {
    return res.status(503).json({ 
      error: 'No se pudieron obtener empleos de ninguna fuente', 
      details: errors 
    });
  }

  // Deduplicar por título + empresa
  const seen = new Set();
  allJobs = allJobs.filter((j) => {
    const key = `${j.title.toLowerCase().trim()}|${j.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordenar por fecha
  allJobs.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());

  // Limitar resultados
  const result = allJobs.slice(0, limit);
  
  // Guardar en caché
  setCached(cacheKey, result);
  
  console.log(`[Response] ✓ Returning ${result.length} jobs (from ${allJobs.length} total, ${errors.length} errors)\n`);

  res.json({ 
    jobs: result, 
    total: allJobs.length, 
    returned: result.length,
    sources: sourceList,
    errors: errors.length > 0 ? errors : undefined
  });
});

/**
 * GET /api/jobs/remote?q=react&limit=20
 * Búsqueda específica de trabajos remotos
 */
app.get('/api/jobs/remote', async (req, res) => {
  const query = req.query.q || 'developer';
  const limit = parseInt(req.query.limit, 10) || 20;

  console.log(`\n[/api/jobs/remote] q="${query}" limit=${limit}`);

  try {
    const jobs = await searchRemotiveJobs(query, limit);
    res.json({ jobs, total: jobs.length, source: 'remotive' });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar trabajos remotos', details: err.message });
  }
});

/**
 * GET /api/jobs/adzuna?q=react&location=Madrid&page=1
 * Búsqueda directa en Adzuna
 */
app.get('/api/jobs/adzuna', async (req, res) => {
  const query = req.query.q || 'developer';
  const location = req.query.location || '';
  const page = parseInt(req.query.page, 10) || 1;

  console.log(`\n[/api/jobs/adzuna] q="${query}" location="${location}" page=${page}`);

  try {
    const jobs = await searchAdzunaJobs(query, location, page, 20);
    res.json({ jobs, total: jobs.length, source: 'adzuna' });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar en Adzuna', details: err.message });
  }
});

/**
 * GET /api/jobs/linkedin-test
 * Endpoint para probar la conexión con LinkedIn
 */
app.get('/api/jobs/linkedin-test', async (req, res) => {
  console.log('\n[/api/jobs/linkedin-test] Probando conexión con LinkedIn API...');
  
  if (!hasRapidApi) {
    return res.status(503).json({
      status: 'error',
      message: 'RAPIDAPI_KEY no configurada',
      instructions: 'Ve a https://rapidapi.com/jaypat87/api/linkedin-jobs-search y suscríbete al plan Basic (gratis)',
    });
  }
  
  try {
    const jobs = await searchLinkedInJobs('javascript', 'Spain', 1);
    res.json({
      status: 'success',
      message: '✓ LinkedIn API configurada correctamente',
      jobsFound: jobs.length,
      sample: jobs.slice(0, 2),
    });
  } catch (err) {
    res.status(403).json({
      status: 'error',
      message: err.message,
      instructions: 'Tu API key no tiene suscripción activa. Ve a https://rapidapi.com/jaypat87/api/linkedin-jobs-search y suscríbete al plan Basic (gratis)',
      currentKey: RAPIDAPI_KEY.substring(0, 10) + '...',
    });
  }
});

/**
 * GET /api/skills/suggest?q=react
 * Sugerencias de skills basadas en búsqueda
 */
app.get('/api/skills/suggest', (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) {
    return res.json({ skills: KNOWN_SKILLS.slice(0, 20) });
  }
  
  const matches = KNOWN_SKILLS.filter(skill => 
    skill.toLowerCase().includes(query)
  ).slice(0, 10);
  
  res.json({ skills: matches, query });
});

/**
 * GET /api/categories
 * Categorías de empleo disponibles
 */
app.get('/api/categories', (req, res) => {
  const categories = [
    { id: 'it-jobs', name: 'IT & Software', icon: 'laptop-outline' },
    { id: 'engineering-jobs', name: 'Ingeniería', icon: 'construct-outline' },
    { id: 'sales-jobs', name: 'Ventas', icon: 'trending-up-outline' },
    { id: 'marketing-jobs', name: 'Marketing', icon: 'megaphone-outline' },
    { id: 'accounting-finance-jobs', name: 'Finanzas', icon: 'cash-outline' },
    { id: 'hr-jobs', name: 'Recursos Humanos', icon: 'people-outline' },
    { id: 'customer-services-jobs', name: 'Atención al Cliente', icon: 'headset-outline' },
    { id: 'retail-jobs', name: 'Retail', icon: 'storefront-outline' },
  ];
  
  res.json({ categories });
});

/**
 * GET /api/health
 * Health check con estadísticas
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apis: {
      adzuna: { configured: hasAdzuna, name: 'Adzuna API', requestsPerMonth: 5000 },
      rapidapi: { configured: hasRapidApi, name: 'RapidAPI', requestsPerMonth: 500 },
      gemini: { configured: hasGemini, name: 'Google Gemini', requestsPerMonth: 'Generous free tier' },
      remotive: { configured: true, name: 'Remotive', requestsPerMonth: 'Unlimited' },
      arbeitnow: { configured: true, name: 'Arbeitnow', requestsPerMonth: 'Unlimited' },
    },
    cache: {
      entries: cache.size,
      ttlMinutes: CACHE_TTL / 60000
    },
    version: '2.0.0'
  });
});

/**
 * POST /api/cache/clear
 * Limpiar caché
 */
app.post('/api/cache/clear', (req, res) => {
  const size = cache.size;
  cache.clear();
  res.json({ message: 'Caché limpiada', entriesCleared: size });
});

/**
 * POST /api/cv/parse
 * Parsea un CV usando Google Gemini AI
 */
app.post('/api/cv/parse', async (req, res) => {
  if (!hasGemini) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY no configurada',
      instructions: 'Ve a https://aistudio.google.com/app/apikey y genera una API key gratuita',
    });
  }

  const { text, fileName } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Se requiere el texto del CV' });
  }

  console.log(`\n[/api/cv/parse] Parsing CV with Gemini (${text.length} chars)`);

  try {
    const profile = await parseCvWithGemini(text, fileName);
    console.log(`[Gemini] ✓ Parsed profile for: ${profile.fullName}`);
    res.json({ profile });
  } catch (err) {
    console.error(`[Gemini] ✗ Parsing failed:`, err.message);
    res.status(500).json({ error: 'Error al parsear CV con Gemini', details: err.message });
  }
});

async function parseCvWithGemini(text, fileName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `Extrae la información estructurada de este currículum vitae. Devuelve un JSON válido y completo.

Reglas:
- fullName: nombre completo del candidato.
- headline: título profesional breve (ej: "Senior Full-stack Developer").
- summary: resumen profesional conciso (máx 400 caracteres).
- skills: array con TODAS las habilidades técnicas y soft skills encontradas.
- experience: array de experiencias laborales. startDate y endDate en formato YYYY-MM. Si sigue en curso, endDate es null.
- education: array de educación. type puede ser degree, certification, bootcamp o course. startDate puede ser solo año (YYYY) o YYYY-MM.
- languages: array de idiomas (solo el nombre, sin niveles).
- location: ciudad y/o país.
- email: correo electrónico o null.
- phone: teléfono o null.

Nombre del archivo: ${fileName || 'CV'}

CV TEXT:
"""
${text.substring(0, 20000)}
"""`;

  const responseSchema = {
    type: 'object',
    properties: {
      fullName: { type: 'string' },
      headline: { type: 'string' },
      summary: { type: 'string' },
      skills: { type: 'array', items: { type: 'string' } },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string', nullable: true },
            description: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            achievements: { type: 'array', items: { type: 'string' } },
            technologies: { type: 'array', items: { type: 'string' } },
          },
          required: ['title', 'company', 'startDate', 'description'],
        },
      },
      education: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['degree', 'certification', 'bootcamp', 'course'] },
            degree: { type: 'string' },
            institution: { type: 'string' },
            field: { type: 'string' },
            location: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string', nullable: true },
            gpa: { type: 'string', nullable: true },
            honors: { type: 'string', nullable: true },
            relevantCoursework: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['completed', 'in-progress', 'expected'] },
          },
          required: ['degree', 'institution', 'startDate'],
        },
      },
      languages: { type: 'array', items: { type: 'string' } },
      location: { type: 'string' },
      email: { type: 'string', nullable: true },
      phone: { type: 'string', nullable: true },
    },
    required: ['fullName', 'headline', 'summary', 'skills', 'experience', 'education', 'languages', 'location'],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        responseSchema,
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  let contentText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!contentText) {
    throw new Error('Respuesta vacía de Gemini');
  }

  // Log para debug
  console.log('[Gemini] Raw response length:', contentText.length);
  console.log('[Gemini] Raw response preview:', contentText.substring(0, 200));

  // Intentar parsear el JSON, manejando errores comunes
  let parsed;
  try {
    parsed = JSON.parse(contentText);
  } catch (parseError) {
    console.warn('[Gemini] JSON parse error, attempting to fix:', parseError.message);
    
    // Intentar extraer JSON de markdown code blocks
    const jsonMatch = contentText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      contentText = jsonMatch[1].trim();
    } else {
      // Intentar encontrar JSON entre llaves
      const braceMatch = contentText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        contentText = braceMatch[0];
      }
    }
    
    // Intentar reparar JSON truncado (comillas sin cerrar, etc.)
    contentText = attemptToFixJson(contentText);
    
    try {
      parsed = JSON.parse(contentText);
    } catch (finalError) {
      console.error('[Gemini] Failed to parse JSON after fix attempts:', contentText.substring(0, 500));
      throw new Error(`JSON parse error: ${finalError.message}`);
    }
  }
  
  return normalizeGeminiProfile(parsed, fileName);
}

/** Attempt to fix common JSON errors */
function attemptToFixJson(jsonString) {
  let fixed = jsonString.trim();
  
  // Remove trailing commas in arrays and objects (handle multiple cases)
  // Case 1: ,] or , }
  fixed = fixed.replace(/,\s*\]/g, ']');
  // Case 2: ,} or , }
  fixed = fixed.replace(/,\s*\}/g, '}');
  // Case 3: Multiple trailing commas
  fixed = fixed.replace(/,+/g, ',');
  // Case 4: Remove trailing commas before closing brackets again
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  
  // Remove trailing comma at the very end
  fixed = fixed.replace(/,$/, '');
  
  // Close unclosed strings (simple heuristic)
  const openQuotes = (fixed.match(/"/g) || []).length;
  if (openQuotes % 2 !== 0) {
    fixed += '"';
  }
  
  // Ensure object is closed
  const openBraces = (fixed.match(/\{/g) || []).length;
  const closeBraces = (fixed.match(/\}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}';
  }
  
  // Ensure arrays are closed
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/\]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixed += ']';
  }
  
  return fixed;
}

function normalizeGeminiProfile(raw, fileName) {
  const { randomUUID } = require('crypto');

  const experience = (raw.experience || []).map((exp) => ({
    title: exp.title || 'Posición',
    company: exp.company || 'Empresa',
    location: exp.location || '',
    startDate: exp.startDate || '',
    endDate: exp.endDate || undefined,
    description: exp.description || '',
    skills: Array.isArray(exp.skills) ? exp.skills : [],
    achievements: Array.isArray(exp.achievements) ? exp.achievements : undefined,
    technologies: Array.isArray(exp.technologies) ? exp.technologies : undefined,
  }));

  const education = (raw.education || []).map((edu) => ({
    type: edu.type || 'degree',
    degree: edu.degree || 'Título',
    institution: edu.institution || 'Institución',
    field: edu.field || '',
    location: edu.location || '',
    startDate: edu.startDate || '',
    endDate: edu.endDate || undefined,
    gpa: edu.gpa || undefined,
    honors: edu.honors || undefined,
    relevantCoursework: Array.isArray(edu.relevantCoursework) ? edu.relevantCoursework : undefined,
    status: edu.status || 'completed',
  }));

  const skills = Array.isArray(raw.skills) ? raw.skills : [];
  const languages = Array.isArray(raw.languages) ? raw.languages : ['Español'];

  const profile = {
    id: randomUUID ? randomUUID() : Math.random().toString(36).slice(2),
    fullName: raw.fullName || 'Usuario',
    headline: raw.headline || 'Profesional',
    summary: raw.summary || `Profesional con experiencia en ${skills.slice(0, 5).join(', ')}.`,
    skills,
    experience,
    education,
    languages,
    location: raw.location || '',
    email: raw.email || undefined,
    phone: raw.phone || undefined,
    cvFileName: fileName || 'CV',
    cvUploadedAt: new Date(),
  };

  // Generar extraction report básico
  const warnings = [];
  if (skills.length < 5) warnings.push('Solo se encontraron ' + skills.length + ' skills');
  if (experience.length === 0) warnings.push('No se encontró sección de experiencia');
  if (education.length === 0) warnings.push('No se encontró sección de educación');
  if (!raw.summary || raw.summary.length < 50) warnings.push('Resumen muy corto o vacío');
  if (!raw.email) warnings.push('No se encontró email');
  if (!raw.phone) warnings.push('No se encontró teléfono');

  const suggestions = [];
  if (skills.length < 10) suggestions.push('Considera agregar más skills específicas en tu CV');
  if (!raw.summary || raw.summary.length < 100) suggestions.push('Agrega un resumen profesional más detallado');

  const completeness = Math.min(
    100,
    Math.round(
      (skills.length > 0 ? 15 : 0) +
      (experience.length > 0 ? 25 : 0) +
      (education.length > 0 ? 15 : 0) +
      (languages.length > 0 ? 10 : 0) +
      (raw.summary ? 15 : 0) +
      (raw.email && raw.phone ? 20 : raw.email || raw.phone ? 10 : 0)
    )
  );

  profile.extractionReport = {
    overallCompleteness: completeness,
    timestamp: new Date(),
    sections: {
      skills: { found: skills.length, confidence: skills.length > 5 ? 0.95 : 0.6 },
      experience: { found: experience.length, completeness: experience.length > 0 ? 0.95 : 0, achievements: experience.reduce((sum, e) => sum + (e.achievements?.length || 0), 0) },
      education: { found: education.length, completeness: education.length > 0 ? 0.95 : 0, types: { degree: education.filter((e) => e.type === 'degree').length, certification: education.filter((e) => e.type === 'certification').length, bootcamp: education.filter((e) => e.type === 'bootcamp').length } },
      languages: { found: languages.length, withLevels: false },
      summary: { found: !!raw.summary, confidence: raw.summary && raw.summary.length > 50 ? 0.9 : 0.5, length: raw.summary?.length || 0 },
      contact: { email: !!raw.email, phone: !!raw.phone, location: !!raw.location },
    },
    warnings,
    suggestions,
  };

  return profile;
}

// ── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`  ✓ SmartJob API server en http://localhost:${PORT}`);
  console.log(`\n  📡 Endpoints disponibles:`);
  console.log(`    GET  /api/jobs/search?q=angular&location=Madrid&sources=all`);
  console.log(`    GET  /api/jobs/adzuna?q=react&location=London`);
  console.log(`    GET  /api/jobs/remote?q=python`);
  console.log(`    GET  /api/skills/suggest?q=java`);
  console.log(`    GET  /api/categories`);
  console.log(`    GET  /api/health`);
  console.log(`    POST /api/cv/parse`);
  console.log(`    POST /api/cache/clear\n`);
});
