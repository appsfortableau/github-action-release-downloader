import { getBooleanInput, getInput } from '@actions/core';
import { GitHub } from '@actions/github/lib/utils';

export type Env = { [key: string]: string | undefined };
export type Github = InstanceType<typeof GitHub>;

export interface Config {
  token: string;
  outdir: string;
  extract: boolean;
}

export interface ReleaseAsset {
  id: number;
  name: string;
  mime: string;
  size: number;
  url: string;
}

export function parseConfig(env: Env): Config {
  return {
    token: getInput('token') || env.GITHUB_TOKEN || '',
    outdir: getInput('outdir') || '.',
    extract: getBooleanInput('extract') || false,
  };
}
