export interface NavNode {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

export interface NavMesh {
  nodes: Record<string, NavNode>;
}

interface NodeRecord {
  id: string;
  cost: number;
  priority: number;
  parent: string | null;
}

const heuristic = (a: NavNode, b: NavNode): number => Math.hypot(a.x - b.x, a.y - b.y);

export const reconstructPath = (cameFrom: Map<string, string | null>, current: string): string[] => {
  const path: string[] = [current];
  let node = cameFrom.get(current) ?? null;
  while (node) {
    path.unshift(node);
    node = cameFrom.get(node) ?? null;
  }
  return path;
};

export const aStar = (mesh: NavMesh, startId: string, goalId: string): string[] => {
  if (!mesh.nodes[startId] || !mesh.nodes[goalId]) {
    return [];
  }

  const openSet = new Map<string, NodeRecord>();
  const cameFrom = new Map<string, string | null>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(mesh.nodes[startId], mesh.nodes[goalId]));

  openSet.set(startId, {
    id: startId,
    cost: 0,
    priority: fScore.get(startId) ?? Number.POSITIVE_INFINITY,
    parent: null
  });

  while (openSet.size > 0) {
    const currentEntry = Array.from(openSet.values()).reduce((best, record) =>
      record.priority < best.priority ? record : best
    );
    const current = currentEntry.id;
    if (current === goalId) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    const currentNode = mesh.nodes[current];
    for (const neighborId of currentNode.neighbors) {
      const neighbor = mesh.nodes[neighborId];
      if (!neighbor) {
        continue;
      }
      const tentativeG = (gScore.get(current) ?? Number.POSITIVE_INFINITY) +
        heuristic(currentNode, neighbor);
      if (tentativeG < (gScore.get(neighborId) ?? Number.POSITIVE_INFINITY)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        const priority = tentativeG + heuristic(neighbor, mesh.nodes[goalId]);
        fScore.set(neighborId, priority);
        openSet.set(neighborId, {
          id: neighborId,
          cost: tentativeG,
          priority,
          parent: current
        });
      }
    }
  }

  return [];
};
