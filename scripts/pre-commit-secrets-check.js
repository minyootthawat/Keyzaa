#!/usr/bin/env node
/**
 * Pre-commit secrets scanner
 * Blocks commits that contain hardcoded credentials, API keys, or secrets.
 * Run via: node scripts/pre-commit-secrets-check.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Secret patterns to detect
const PATTERNS = [
  // Supabase / generic API keys
  { name: 'Supabase Service Role Key', regex: /sb_secret_[a-zA-Z0-9]{20,}/ },
  { name: 'Supabase Publishable Key', regex: /sb_publishable_[a-zA-Z0-9_-]{10,}/ },
  { name: 'Generic API Key pattern', regex: /api[_-]?key["\s:=]+["\']?[a-zA-Z0-9_-]{20,}["\']?/i },
  // Database connection strings
  { name: 'PostgreSQL connection string', regex: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/ },
  { name: 'MongoDB connection string', regex: /mongodb:\/\/[^:\s]+:[^@\s]+@/ },
  // JWT tokens (bare, not in proper context)
  { name: 'JWT Token', regex: /\b(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/ },
  // Stripe keys
  { name: 'Stripe Secret Key', regex: /sk_live_[a-zA-Z0-9]{24,}/ },
  { name: 'Stripe Publishable Key', regex: /pk_live_[a-zA-Z0-9]{24,}/ },
  { name: 'Stripe Test Key', regex: /sk_test_[a-zA-Z0-9]{24,}/ },
  // Generic secrets
  { name: 'Bearer Token', regex: /Bearer\s+[a-zA-Z0-9_.-]{20,}/ },
  { name: 'Authorization Header', regex: /Authorization:\s*["\']?[A-Za-z0-9_-]{20,}["\']?/i },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS Secret Key', regex: /[a-zA-Z0-9/+=]{40}/ },
  // Private keys
  { name: 'RSA Private Key', regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Generic Secret', regex: /secret["\s:=]+["\']?[a-zA-Z0-9_.-]{16,}["\']?/i },
  // Vercel OIDC tokens
  { name: 'Vercel OIDC Token', regex: /eyJhbG[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/ },
];

// Files/directories to skip
const SKIP_PATHS = [
  'node_modules/',
  '.git/',
  '.next/',
  'coverage/',
  'package-lock.json',
  '.detect-secrets.baseline',
  'public/',
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    // No staged files
    return [];
  }
}

function shouldSkip(filePath) {
  return SKIP_PATHS.some((skip) => filePath.includes(skip));
}

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  if (shouldSkip(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];

  for (const { name, regex } of PATTERNS) {
    // Reset regex lastIndex
    regex.lastIndex = 0;
    if (regex.test(content)) {
      findings.push(name);
    }
  }

  return findings;
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('✅ No staged files to scan.');
    process.exit(0);
  }

  let hasSecret = false;

  for (const file of stagedFiles) {
    const findings = scanFile(file);
    if (findings.length > 0) {
      hasSecret = true;
      console.error(`🚨 SECRET DETECTED in: ${file}`);
      for (const finding of findings) {
        console.error(`   - ${finding}`);
      }
    }
  }

  if (hasSecret) {
    console.error('\n❌ Commit blocked: Secrets detected in staged files.');
    console.error('   Remove hardcoded secrets and use environment variables instead.');
    console.error('   If this is a false positive, you may bypass with: git commit --no-verify');
    process.exit(1);
  }

  console.log('✅ Secrets scan passed — no hardcoded credentials detected.');
  process.exit(0);
}

main();
