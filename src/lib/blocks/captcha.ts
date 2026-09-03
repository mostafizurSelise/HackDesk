import { blocksClient } from "./client";

export type CaptchaUiConfig = { key: string; provider: string; generator: string } | undefined;

// GET /idp/ui-config is public (no bearer token) and returns the tenant's
// active login captcha, or none if disabled -- see blocks-captcha skill.
// Casing is defensive: the wire response has been observed in both Pascal
// and camel case depending on endpoint.
export async function fetchCaptchaConfig(): Promise<CaptchaUiConfig> {
  const response = (await blocksClient.auth.idp.uiConfig()) as Record<string, unknown>;
  const captcha = (response.captcha ?? response.Captcha) as Record<string, unknown> | null | undefined;
  if (!captcha) return undefined;

  const key = (captcha.key ?? captcha.Key) as string | undefined;
  const provider = (captcha.provider ?? captcha.Provider) as string | undefined;
  const generator = (captcha.generator ?? captcha.Generator) as string | undefined;
  if (!key || !provider) return undefined;

  return { generator: generator ?? "", key, provider };
}
