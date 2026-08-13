import projects from "./mock-data.json";

export type MockProject = {
  id: string;
  name: string;
  summary: string;
  status: "planning" | "active" | "paused";
  owner: string;
};

/**
 * Deterministic local data that stands in for a user's selected OpenWork
 * Connect provider. It is never compiled into the published artifact bundle.
 */
export const mockProjects = projects as MockProject[];

export function searchMockProjects(query: string): MockProject[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return mockProjects;
  return mockProjects.filter((project) =>
    [project.name, project.summary, project.status, project.owner]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}
