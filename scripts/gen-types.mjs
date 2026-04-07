#!/usr/bin/env node
/**
 * Generate TypeScript types from OpenAPI schemas
 */

import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');
const schemasDir = join(rootDir, 'schemas');
const outputDir = join(rootDir, 'packages', 'api-client', 'src', 'generated');

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

if (!existsSync(schemasDir)) {
  console.error('Schemas directory not found. Run `python scripts/export_openapi.py` first.');
  process.exit(1);
}

const schemaFiles = readdirSync(schemasDir).filter(f => f.endsWith('.json'));

if (schemaFiles.length === 0) {
  console.error('No schema files found. Run `python scripts/export_openapi.py` first.');
  process.exit(1);
}

console.log('Generating TypeScript types from OpenAPI schemas...\n');

for (const schemaFile of schemaFiles) {
  const serviceName = basename(schemaFile, '.json');
  const inputPath = join(schemasDir, schemaFile);
  const outputPath = join(outputDir, `${serviceName}.ts`);
  
  try {
    execSync(`npx openapi-typescript "${inputPath}" -o "${outputPath}"`, {
      stdio: 'inherit',
      cwd: rootDir
    });
    console.log(`  ✅ ${serviceName}: ${outputPath}`);
  } catch (error) {
    console.error(`  ❌ ${serviceName}: Failed to generate types`);
  }
}

console.log('\nType generation complete!');
