import { it, describe, expect } from 'vitest';
import { getGitRevision } from './versioning';

describe('versioning', () => {
  it('should return a valid revision', () => {
    const revision = getGitRevision();

    expect(revision).to.be.a('string');
    expect(revision).to.have.lengthOf(7); // Assuming the revision is always 7 characters long
  });
});
