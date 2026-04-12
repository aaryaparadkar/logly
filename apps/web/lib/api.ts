const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export async function fetchChangelog(
  owner: string,
  repo: string,
  token?: string,
) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);

  const url = `${API_URL}/changelogs/${owner}/${repo}${params.toString() ? `?${params}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch changelog: ${response.statusText}`);
  }

  return response.json();
}

export async function generateChangelog(
  owner: string,
  repo: string,
  token?: string,
  limit?: number,
) {
  const response = await fetch(`${API_URL}/changelogs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      owner,
      repo,
      token,
      limit: limit || 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate changelog: ${response.statusText}`);
  }

  return response.json();
}

export async function updateChangelog(
  owner: string,
  repo: string,
  data: any,
  token?: string,
) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);

  const response = await fetch(
    `${API_URL}/changelogs/${owner}/${repo}?${params}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update changelog: ${response.statusText}`);
  }

  return response.json();
}

export async function regenerateEntry(
  owner: string,
  repo: string,
  entryId: string,
  token?: string,
) {
  const params = new URLSearchParams();
  if (token) params.set("token", token);

  const response = await fetch(
    `${API_URL}/changelogs/${owner}/${repo}/regenerate/${entryId}?${params}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to regenerate entry: ${response.statusText}`);
  }

  return response.json();
}

export async function exportChangelog(
  owner: string,
  repo: string,
  format: "markdown" | "json" | "html",
) {
  const response = await fetch(`${API_URL}/export/${owner}/${repo}/${format}`);

  if (!response.ok) {
    throw new Error(`Failed to export: ${response.statusText}`);
  }

  if (format === "json") {
    return response.json();
  }

  return response.text();
}
