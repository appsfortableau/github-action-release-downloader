import { debug, info } from '@actions/core';
import { Context } from '@actions/github/lib/context';
import * as fetch from 'node-fetch';
import { Config, Github } from './utils';
import { btoa } from 'buffer';

// inspiration: https://github.com/softprops/action-gh-release/blob/cd28b0f5ee8571b76cfdaa62a30d51d752317477/src/github.ts

export interface ARelease {
  id: number;
  upload_url: string;
  html_url: string;
  tag_name: string;
  name: string | null;
  body?: string | null | undefined;
  target_commitish: string;
  draft: boolean;
  prerelease: boolean;
  assets: Array<{ id: number; name: string }>;
}

export interface ReleaserOptions {
  owner: string;
  repo: string;
}

export interface Ref {
  ref: string;
  node_id: string;
  url: string;
  object: { type: string; sha: string; url: string };
}

class ReleaseApi {
  github: Github;
  config: Config;
  context: Context;

  constructor(github: Github, config: Config, context: Context) {
    this.github = github;
    this.config = config;
    this.context = context;
  }

  async getReleaseForTag(
    owner: string,
    repo: string,
    tag: string
  ): Promise<ARelease | null> {
    try {
      debug(`Owner: ${owner}, Repo: ${repo}, tag: ${tag}`);
      const { data: release } = await this.github.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      });

      return release as ARelease;
    } catch (err) {
      info('Release not found/exists, fallback loop through release list');
    }

    info('Fallback, lets lookup in the list');

    const releases = await this.github.rest.repos.listReleases({
      owner,
      repo,
    });

    const release = releases.data.find(
      (release: ARelease) => release.tag_name === tag
    );

    return release ? (release as ARelease) : null;
  }

  async downloadRelease(
    owner: string,
    repo: string,
    assetId: number
  ): Promise<any> {
    try {
      const { data } = await this.github.rest.repos.getReleaseAsset({
        owner,
        repo,
        asset_id: assetId,
        headers: {
          Accept: 'application/octet-stream',
        },
      });

      return data;
    } catch (err) {
      info(`Error while downloading release asset ${assetId}: ` + err);
    }
  }
}

export default ReleaseApi;
