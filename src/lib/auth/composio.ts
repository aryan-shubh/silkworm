import { Composio } from "@composio/core";

let _composio: Composio | null = null;
let _initTried = false;

export function getComposio(): Composio | null {
  if (_initTried) return _composio;
  _initTried = true;
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) return null;
  _composio = new Composio({ apiKey });
  return _composio;
}

export function getGithubAuthConfigId(): string | null {
  return process.env.COMPOSIO_GITHUB_AUTH_CONFIG_ID ?? null;
}
