import { debug, error, info, setOutput, warning } from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { basename } from 'path';
import * as fetch from 'node-fetch';
import {
  Config,
  // paths as utilsPaths,
  // asset as utilsAsset,
  // uploadUrl,
  Github,
} from './utils';
import { writeFileSync } from 'fs';

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
      const { data: release } = await this.github.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag,
      });

      return release as ARelease;
    } catch (err) {
      info('Release was not published or tag does not exists yet: ' + err);
    }

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

  // async uploadAssets(release: ARelease, paths: string[]) {
  //   if (paths.length === 0) {
  //     return [];
  //   }

  //   const files = utilsPaths(paths);
  //   const baseUrl = uploadUrl(release.upload_url);
  //   if (files.length == 0) {
  //     warning(`🤔 ${files} not include valid file.`);
  //     return;
  //   }

  //   return await Promise.all(
  //     files.map(async (file: string) => {
  //       const asset = utilsAsset(file);

  //       const releaseUploadUrl = new URL(baseUrl);
  //       releaseUploadUrl.searchParams.append('name', basename(file));

  //       debug(`⬆️  Uploading  "${asset.name}" to Github`);

  //       const response = await fetch(releaseUploadUrl, {
  //         headers: {
  //           'Content-Type': asset.mime,
  //           'Content-Length': `${asset.size}`,
  //           Authorization: `Bearer ${this.config.token}`,
  //         },
  //         method: 'POST',
  //         body: asset.data,
  //       });
  //       const res = await response.json();

  //       if (!res.id) {
  //         // SOMETHING when wrong
  //         error(
  //           'Something went wrong while upload release assets: ' + res.message
  //         );
  //         return {};
  //       }

  //       return res;
  //     })
  //   );
  // }
}

export default ReleaseApi;
