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
export const mockProjects: MockProject[] = [
  {
    id: "project-atlas",
    name: "Project Atlas",
    summary: "Migrate the customer workspace to the unified project index.",
    status: "active",
    owner: "Mina",
  },
  {
    id: "project-lighthouse",
    name: "Project Lighthouse",
    summary: "Plan the analytics migration and reporting cutover.",
    status: "planning",
    owner: "Theo",
  },
  {
    id: "project-orbit",
    name: "Project Orbit",
    summary: "Consolidate partner onboarding into the new operations hub.",
    status: "paused",
    owner: "Ava",
  },
];

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
