import React from "react";

export default async function ProjectPage(
  props: PageProps<"/projects/[projectId]">
) {
  const { projectId } = await props.params;
  return <h1>Project ID: {projectId}</h1>;
}
