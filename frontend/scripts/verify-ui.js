// MediKiosk UI Quality & Safety Guard (Ponytail Self-Check)
// Zero-dependency runner using Node stdlib assert & fs
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');

console.log('--- RUNNING MEDIKIOSK UI QUALITY & SAFETY SELF-CHECK ---');

const srcDir = path.resolve(__dirname, '../src');

// 1. Check required screens and components
const requiredFiles = [
  'app/page.tsx',
  'app/patient/page.tsx',
  'app/doctor/page.tsx',
  'app/admin/page.tsx',
  'app/globals.css',
  'components/shared.tsx',
  'components/icons.tsx',
  'components/ui/button.tsx',
  'components/ui/badge.tsx'
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(srcDir, relPath);
  assert(fs.existsSync(fullPath), `Required file missing: ${relPath}`);
}
console.log('✓ All 9 critical screens & design system primitives exist.');

// 2. Check exported components in shared.tsx
const sharedContent = fs.readFileSync(path.join(srcDir, 'components/shared.tsx'), 'utf-8');
const requiredExports = [
  'MKLogo',
  'PriorityBadge',
  'StatusChip',
  'ConfidenceBadge',
  'CaseTimeline',
  'EvidenceDrawer',
  'AITriageContext',
  'WhyAllocation',
  'ConfirmDialog',
  'pushToast',
  'ToastContainer',
  'Skeleton',
  'EmptyState',
  'OpsShell',
  'ReasonInput',
  'AuditRow'
];

for (const exp of requiredExports) {
  assert(
    sharedContent.includes(`export function ${exp}`) || sharedContent.includes(`export const ${exp}`),
    `Missing required shared export: ${exp}`
  );
}
console.log(`✓ All ${requiredExports.length} clinical shared components exported correctly.`);

// 3. Scan for forbidden diagnostic claims and banned visual gimmicks
const forbiddenPatterns = [
  { pattern: /AI diagnosis/i, name: '"AI diagnosis" (Clinical Safety Violation - must use AI Triage Context)' },
  { pattern: /disease probability/i, name: '"disease probability" (Clinical Safety Violation)' },
  { pattern: /backdrop-filter:\s*blur\(2[0-9]px\)/i, name: 'Heavy frosted glassmorphism (>20px)' },
  { pattern: /SpotlightCard/i, name: 'Banned SpotlightCard UI slop' },
  { pattern: /AnimatedCounter/i, name: 'Banned AnimatedCounter UI slop' },
  { pattern: /BentoGrid/i, name: 'Banned BentoGrid UI slop' }
];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(full);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css')) {
      const content = fs.readFileSync(full, 'utf-8');
      for (const { pattern, name } of forbiddenPatterns) {
        assert(!pattern.test(content), `Safety/Taste Violation found in ${path.relative(srcDir, full)}: ${name}`);
      }
    }
  }
}

scanDir(srcDir);
console.log('✓ Zero forbidden diagnostic claims or banned AI-slop components detected.');

console.log('--- ALL UI CHECKS PASSED CLEANLY ---');
