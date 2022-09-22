import { Config, Env, Github, parseConfig } from './utils';
import { context, getOctokit } from '@actions/github';
import { OctokitOptions } from '@octokit/core/dist-types/types';
import { debug, warning } from '@actions/core';
import { Context } from '@actions/github/lib/context';

export function doInit(env: Env): {
  config: Config;
  github: Github;
  context: Context;
} {
  const config = parseConfig(env);
  const github = getOctokit(config.token, {
    timeZone: 'Europe/Amsterdam',
    throttle: {
      onRateLimit: (retryAfter: number, options: OctokitOptions) => {
        warning(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );

        if (options.request?.retryCount === 0) {
          // only retries once
          debug(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onAbuseLimit: (_: number, options: OctokitOptions) => {
        // does not retry, only logs a warning
        warning(`Abuse detected for request ${options.method} ${options.url}`);
      },
    },
  });

  return {
    config,
    github,
    context,
  };
}
