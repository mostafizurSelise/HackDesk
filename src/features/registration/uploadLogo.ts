import { blocksClient } from "../../lib/blocks/client";

type PresignResult = { uploadUrl: string; fileId: string; isSuccess: boolean; errors?: Record<string, string> };

// Uploads to the project's default storage configuration -- no cloud
// provider account needed, see blocks-storage-configuration skill.
export async function uploadLogo(file: File): Promise<string> {
  const presign = (await blocksClient.data.files.presignedUploadUrl({
    accessModifier: "Private",
    configurationName: "Default",
    name: file.name,
    parentDirectoryId: "",
    tags: "hackdesk,team-logo"
  })) as PresignResult;

  if (!presign?.isSuccess) throw new Error(presign?.errors ? JSON.stringify(presign.errors) : "Upload could not start.");

  await blocksClient.data.files.uploadToUrl({
    body: file,
    contentType: file.type || "application/octet-stream",
    url: presign.uploadUrl
  });

  return presign.fileId;
}

// Requires blocks-data::file::get-file on the caller's role -- granted to
// both participant (their own logo) and organizer (every team's logo).
export async function getLogoUrl(fileId: string): Promise<string> {
  const file = (await blocksClient.data.files.get(fileId)) as { url?: string };
  if (!file?.url) throw new Error("Logo could not be loaded.");
  return file.url;
}
