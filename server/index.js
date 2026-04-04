require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
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

const hasRapidApi = RAPIDAPI_KEY && RAPIDAPI_KEY !== 'tu_api_key_aqui';
const hasGemini = GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY' && GEMINI_API_KEY !== 'tu_api_key_aqui';

if (!hasRapidApi) {
  console.warn('  ⚠️  RAPIDAPI_KEY: No configurada (fallback opcional)');
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
// LINKEDIN JOBS - RapidAPI + Scraper directo
// ═══════════════════════════════════════════════════════════

async function searchLinkedInJobs(query, location, page = 1, geoId = null) {
  // 1. Intentar RapidAPI primero si está configurada
  if (hasRapidApi) {
    try {
      const rapidJobs = await searchLinkedInRapidApi(query, location, page);
      if (rapidJobs.length > 0) return rapidJobs;
    } catch (err) {
      if (!err.message?.includes('429')) {
        throw err;
      }
      console.warn('[LinkedIn] RapidAPI 429, fallback a scraper directo...');
    }
  }

  // 2. Fallback: scraper directo de LinkedIn Jobs (usar geoId si está disponible)
  return searchLinkedInScraper(query, location, page, geoId);
}

async function searchLinkedInRapidApi(query, location, page = 1) {
  const url = 'https://linkedin-jobs-search.p.rapidapi.com/';
  const body = {
    search_terms: query,
    location: location || 'Spain',
    page: String(page),
    fetch_full_text: 'yes',
  };

  console.log(`[LinkedIn RapidAPI] Searching: "${query}" in "${location || 'Spain'}" (page ${page})`);

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
    console.error(`[LinkedIn RapidAPI] Error ${response.status}:`, errorText);
    throw new Error(`LinkedIn API responded ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`[LinkedIn RapidAPI] Got ${Array.isArray(data) ? data.length : 0} results`);

  const jobs = Array.isArray(data) ? data : (data.jobs || data.data || []);
  return jobs.map(normalizeLinkedInJob);
}

async function searchLinkedInScraper(query, location, page = 1, geoId = null) {
  const start = (page - 1) * 25;
  const locParam = location ? `&location=${encodeURIComponent(location)}` : '';
  const geoParam = geoId ? `&geoId=${geoId}` : '';
  const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}${locParam}${geoParam}&start=${start}`;

  console.log(`[LinkedIn Scraper] Searching: "${query}" in "${location || 'Any'}" (start ${start})`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`LinkedIn scraper responded ${response.status}`);
  }

  const html = await response.text();
  if (!html || html.trim().length === 0) {
    return [];
  }

  // Parsear tarjetas de empleo del HTML
  const jobs = parseLinkedInJobCards(html);
  console.log(`[LinkedIn Scraper] ✓ ${jobs.length} jobs parsed`);

  // Enriquecer con descripciones (opcional, limitado a los primeros 5 para no saturar)
  const enriched = [];
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (i < 5 && job.linkedinUrl) {
      try {
        const details = await fetchLinkedInJobDetails(job.linkedinUrl);
        job.description = details.description || job.description;
        job.requirements = details.requirements;
      } catch (e) {
        // Ignorar errores de detalle
      }
    }
    enriched.push(job);
  }

  return enriched;
}

function parseLinkedInJobCards(html) {
  const jobs = [];
  // LinkedIn devuelve <li> con tarjetas
  const cardRegex = /<li[^>]*>\s*<div[^>]*class="base-card[^"]*job-search-card[^"]*"[^>]*data-entity-urn="urn:li:jobPosting:(\d+)"[^>]*>[\s\S]*?<\/div>\s*<\/li>/gi;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const cardHtml = match[0];
    const jobId = match[1];

    const titleMatch = cardHtml.match(/<h3[^>]*class="base-search-card__title"[^>]*>([\s\S]*?)<\/h3>/i);
    const companyMatch = cardHtml.match(/<a[^>]*class="hidden-nested-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i);
    const locationMatch = cardHtml.match(/<span[^>]*class="job-search-card__location"[^>]*>([\s\S]*?)<\/span>/i);
    const timeMatch = cardHtml.match(/<time[^>]*datetime="([^"]+)"/i);
    const logoMatch = cardHtml.match(/<img[^>]*class="artdeco-entity-image[^"]*"[^>]*data-delayed-url="([^"]+)"/i);
    const urlMatch = cardHtml.match(/<a[^>]*class="base-card__full-absolute-link[^"]*"[^>]*href="([^"]+)"/i);

    const title = titleMatch ? stripHtml(titleMatch[1]).trim() : '';
    const company = companyMatch ? stripHtml(companyMatch[1]).trim() : '';
    const jobLocation = locationMatch ? stripHtml(locationMatch[1]).trim() : '';
    const postedAt = timeMatch ? timeMatch[1] : new Date().toISOString();
    const companyLogo = logoMatch ? logoMatch[1] : null;
    const jobUrl = urlMatch ? urlMatch[1] : `https://www.linkedin.com/jobs/view/${jobId}`;

    if (title && company) {
      jobs.push({
        id: `linkedin-${jobId}`,
        title,
        company,
        companyLogo,
        location: jobLocation,
        remote: detectRemoteType(title, jobLocation, ''),
        salary: null,
        description: '',
        requirements: extractSkills(`${title} ${company} ${jobLocation}`),
        postedAt,
        linkedinUrl: jobUrl,
        source: 'linkedin',
        matchScore: 0,
        matchBreakdown: { skillsMatch: 0, experienceMatch: 0, locationMatch: 0, seniorityMatch: 0 },
        saved: false,
        applied: false,
      });
    }
  }

  return jobs;
}

async function fetchLinkedInJobDetails(jobUrl) {
  const jobIdMatch = jobUrl.match(/\d+/);
  if (!jobIdMatch) return { description: '', requirements: [] };

  const detailUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobIdMatch[0]}`;
  const response = await fetch(detailUrl, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    return { description: '', requirements: [] };
  }

  const html = await response.text();
  const descMatch = html.match(/<div[^>]*class="description__text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="show-more-less-html__button-container|<\/div>)/i) ||
                    html.match(/<div[^>]*class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  const description = descMatch ? stripHtml(descMatch[1]).trim() : '';
  return {
    description,
    requirements: extractSkills(description),
  };
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

// ═══════════════════════════════════════════════════════════
// RUTAS
// ═══════════════════════════════════════════════════════════

// Mapeo de códigos ISO a nombres de país para LinkedIn
const ISO_COUNTRY_MAP = {
  'ES': 'Spain', 'US': 'United States', 'GB': 'United Kingdom',
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'PT': 'Portugal',
  'NL': 'Netherlands', 'CA': 'Canada', 'MX': 'Mexico', 'AR': 'Argentina',
  'BR': 'Brazil', 'CL': 'Chile', 'CO': 'Colombia', 'AU': 'Australia',
  'IN': 'India', 'JP': 'Japan', 'SG': 'Singapore', 'IE': 'Ireland',
  'CH': 'Switzerland', 'AT': 'Austria', 'BE': 'Belgium', 'SE': 'Sweden',
  'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland',
  'CZ': 'Czech Republic', 'HU': 'Hungary', 'RO': 'Romania', 'GR': 'Greece',
  'TR': 'Turkey', 'RU': 'Russia', 'CN': 'China', 'KR': 'South Korea',
  'TW': 'Taiwan', 'HK': 'Hong Kong', 'TH': 'Thailand', 'VN': 'Vietnam',
  'ID': 'Indonesia', 'MY': 'Malaysia', 'PH': 'Philippines', 'NZ': 'New Zealand',
  'ZA': 'South Africa', 'AE': 'United Arab Emirates', 'IL': 'Israel',
  'SA': 'Saudi Arabia', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya',
  'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador', 'UY': 'Uruguay',
  'PY': 'Paraguay', 'BO': 'Bolivia', 'CR': 'Costa Rica', 'PA': 'Panama',
  'GT': 'Guatemala', 'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua',
  'CU': 'Cuba', 'DO': 'Dominican Republic', 'JM': 'Jamaica',
};

// geoIds de LinkedIn para filtrado preciso por país en el scraper
const LINKEDIN_GEOID_MAP = {
  'ES': '105646813', 'US': '103644278', 'GB': '101165590',
  'DE': '101282230', 'FR': '105015875', 'IT': '103350119',
  'PT': '100364837', 'NL': '102890719', 'CA': '101174742',
  'MX': '103056806', 'AR': '100446943', 'BR': '106057199',
  'CL': '104621616', 'CO': '100876405', 'AU': '101452733',
  'IN': '102713980', 'JP': '101355337', 'SG': '102454443',
  'IE': '104994100', 'CH': '106693272', 'AT': '104341204',
  'BE': '100565514', 'SE': '105117694', 'NO': '103819153',
  'DK': '104514075', 'FI': '100293109', 'PL': '105072130',
  'CZ': '104508036', 'HU': '100900800', 'RO': '106670623',
  'GR': '104677530', 'TR': '102105699', 'RU': '101728296',
  'CN': '102890883', 'KR': '105149562', 'TW': '104222089',
  'HK': '103291352', 'TH': '105924831', 'VN': '104195837',
  'ID': '102478331', 'MY': '106808866', 'PH': '103121894',
  'NZ': '105490917', 'ZA': '104130737', 'AE': '104305776',
  'IL': '101490751', 'SA': '100459316', 'EG': '106155005',
  'NG': '105365761', 'KE': '100799100', 'PE': '102927786',
  'VE': '101490751', 'EC': '106155116', 'UY': '106932038',
  'PY': '104065328', 'BO': '104379274', 'CR': '101496778',
  'PA': '101907273', 'GT': '100877805', 'HN': '105704424',
  'SV': '106121042', 'NI': '103824890', 'CU': '106981808',
  'DO': '106178322', 'JM': '106069890',
};

/**
 * GET /api/jobs/search?q=angular&location=Madrid&page=1&limit=25&sources=all
 * 
 * Fuente única: linkedin
 */
app.get('/api/jobs/search', async (req, res) => {
  const query = req.query.q || 'developer';
  let location = req.query.location || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const sources = req.query.sources || 'all';

  const originalLocation = location;
  let geoId = null;

  // Mapa inverso: nombre de país → código ISO
  const COUNTRY_TO_ISO_MAP = Object.fromEntries(
    Object.entries(ISO_COUNTRY_MAP).map(([code, name]) => [name.toLowerCase(), code])
  );

  // Resolver geoId: si es código ISO de 2 letras, o si es nombre de país
  if (location) {
    if (location.length === 2) {
      const upper = location.toUpperCase();
      if (ISO_COUNTRY_MAP[upper]) {
        location = ISO_COUNTRY_MAP[upper];
      }
      if (LINKEDIN_GEOID_MAP[upper]) {
        geoId = LINKEDIN_GEOID_MAP[upper];
      }
    } else {
      const isoCode = COUNTRY_TO_ISO_MAP[location.toLowerCase()];
      if (isoCode && LINKEDIN_GEOID_MAP[isoCode]) {
        geoId = LINKEDIN_GEOID_MAP[isoCode];
      }
    }
  }

  console.log(`\n[/api/jobs/search] q="${query}" location="${location}" geoId="${geoId || ''}" page=${page} sources=${sources}`);

  // Verificar caché (incluir geoId en la clave si existe)
  const cacheKey = getCacheKey(query, location + (geoId ? `_${geoId}` : ''), page, sources);
  const cached = getCached(cacheKey);
  if (cached && !req.query.nocache) {
    console.log(`[Cache] ✓ Retornando resultados en caché`);
    return res.json({ jobs: cached, total: cached.length, source: 'cache', cached: true });
  }

  let allJobs = [];
  const errors = [];
  const attemptedSources = [];

  // Construir lista de fuentes según configuración
  let sourceList;
  if (sources === 'all') {
    sourceList = ['linkedin'];
  } else {
    sourceList = sources.split(',');
  }

  // Helper para ejecutar búsquedas y trackear intentos
  async function trySource(name, fn) {
    if (!sourceList.includes(name)) return;
    attemptedSources.push(name);
    try {
      const jobs = await fn();
      console.log(`[${name}] ✓ ${jobs.length} jobs found`);
      allJobs.push(...jobs);
    } catch (err) {
      console.warn(`[${name}] ✗ ${err.message}`);
      errors.push({ source: name, error: err.message });
    }
  }

  // SOLO LinkedIn (pasar geoId para filtrado preciso)
  await trySource('linkedin', () => searchLinkedInJobs(query, location, page, geoId));

  if (allJobs.length === 0 && errors.length > 0) {
    return res.status(503).json({ 
      error: 'LinkedIn API no disponible. Cuota mensual excedida o API key inválida.', 
      details: errors 
    });
  }

  // Filtro de ubicación: si se especificó un país, descartar jobs que no coincidan
  if (originalLocation && originalLocation.length === 2) {
    const countryName = ISO_COUNTRY_MAP[originalLocation.toUpperCase()];
    if (countryName) {
      const beforeFilter = allJobs.length;
      allJobs = allJobs.filter((j) => {
        const loc = (j.location || '').toLowerCase();
        // Coincidir con el nombre en inglés o el código ISO
        return loc.includes(countryName.toLowerCase()) ||
               loc.includes(originalLocation.toLowerCase());
      });
      console.log(`[Location Filter] ${beforeFilter} → ${allJobs.length} jobs matching "${countryName}"`);
    }
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
 * GET /api/jobs/linkedin-test
 * Endpoint para probar la conexión con LinkedIn
 */
app.get('/api/jobs/linkedin-test', async (req, res) => {
  console.log('\n[/api/jobs/linkedin-test] Probando conexión con LinkedIn Jobs...');
  
  try {
    const jobs = await searchLinkedInJobs('javascript', 'Spain', 1);
    res.json({
      status: 'success',
      message: '✓ LinkedIn Jobs scraper funcionando correctamente',
      jobsFound: jobs.length,
      sample: jobs.slice(0, 2),
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
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
      linkedin: { configured: true, name: 'LinkedIn Jobs (Scraper directo)', requestsPerMonth: 'Unlimited' },
      rapidapi: { configured: hasRapidApi, name: 'RapidAPI LinkedIn (fallback)', requestsPerMonth: 500 },
      gemini: { configured: hasGemini, name: 'Google Gemini', requestsPerMonth: 'Generous free tier' },
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
  console.log(`    GET  /api/jobs/linkedin-test`);
  console.log(`    GET  /api/skills/suggest?q=java`);
  console.log(`    GET  /api/categories`);
  console.log(`    GET  /api/health`);
  console.log(`    POST /api/cv/parse`);
  console.log(`    POST /api/cache/clear\n`);
});
