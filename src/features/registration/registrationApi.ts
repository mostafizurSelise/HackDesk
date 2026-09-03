import { blocksClient } from "../../lib/blocks/client";

// Row-level security on the Registration schema already scopes list() to the
// caller's own record (or all records for an organizer) -- see
// blocks/data/rules.json. No CreatedBy filter is needed here; the platform
// enforces it server-side, not this file.
export type Registration = Record<string, unknown> & {
  itemId?: string;
  FullName?: string;
  Email?: string;
  TeamName?: string;
  TeammateEmails?: string[];
  ExperienceLevel?: string;
  AiCli?: string;
  GithubHandle?: string;
  LogoFileId?: string;
  Status?: string;
  CreatedBy?: string;
};

export type RegistrationInput = {
  FullName: string;
  Email: string;
  TeamName: string;
  TeammateEmails?: string[];
  ExperienceLevel?: string;
  AiCli: string;
  GithubHandle?: string;
  LogoFileId?: string;
};

const registrations = blocksClient.data.collection<Registration>("Registration", {
  fields: [
    "FullName",
    "Email",
    "TeamName",
    "TeammateEmails",
    "ExperienceLevel",
    "AiCli",
    "GithubHandle",
    "LogoFileId",
    "Status",
    "CreatedBy"
  ]
});

export async function listRegistrations(): Promise<Registration[]> {
  const response = await registrations.list({ pageNo: 1, pageSize: 200 });
  const data = response as unknown as { data?: Registration[]; items?: Registration[] };
  return data.data ?? data.items ?? (Array.isArray(response) ? (response as Registration[]) : []);
}

export function createRegistration(input: RegistrationInput) {
  return registrations.create(input);
}

export function updateRegistration(itemId: string, input: Partial<RegistrationInput>) {
  return registrations.update(itemId, input);
}

export function setRegistrationStatus(itemId: string, status: "approved" | "waitlisted" | "submitted") {
  return registrations.update(itemId, { Status: status });
}
