import { execSync } from 'child_process';
export function getGitRevision(): string {
  return execSync('git rev-parse --short HEAD').toString().trim();
}
