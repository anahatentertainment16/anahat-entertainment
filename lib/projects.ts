// Portfolio projects with their tags flattened from the project_tags join table.
export const PROJECT_SELECT = "id, title, link, description, image_url, featured, project_tags(tag)";

export const withTags = <T extends { project_tags?: { tag: string }[] | null }>(rows: T[]) =>
  rows.map(({ project_tags, ...p }) => ({ ...p, tags: (project_tags ?? []).map((t) => t.tag).sort() }));
