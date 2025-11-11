import { describe, expect, it } from 'vitest';
import { aStar, type NavMesh } from '@workers/pathfinding';

describe('pathfinding', () => {
  it('finds a path in a simple navmesh', () => {
    const mesh: NavMesh = {
      nodes: {
        A: { id: 'A', x: 0, y: 0, neighbors: ['B'] },
        B: { id: 'B', x: 1, y: 0, neighbors: ['A', 'C'] },
        C: { id: 'C', x: 2, y: 0, neighbors: ['B'] }
      }
    };
    const path = aStar(mesh, 'A', 'C');
    expect(path).toEqual(['A', 'B', 'C']);
  });

  it('returns empty when nodes missing', () => {
    const mesh: NavMesh = { nodes: {} };
    expect(aStar(mesh, 'A', 'C')).toEqual([]);
  });
});
