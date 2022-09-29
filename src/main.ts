import { exec } from '@actions/exec';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { debug, error, warning } from '@actions/core';
import { doInit } from './startup';
import ReleaseApi from './release';
import { ReleaseAsset } from './utils';
import { join } from 'path';

async function run() {
  const { context, github, config } = doInit();

  if (!context.payload?.repository?.full_name) {
    error('Action repository information not found');
    return;
  }

  // grab the owner and repo from the repository
  const repository = context.payload.repository;
  const [owner, repo] = repository?.full_name?.split('/') ?? ['', ''];

  debug(`OWNER: ${owner}`);
  debug(`REPO: ${repo}`);

  const model = new ReleaseApi(github, config, context);

  // load package.json
  const packageJson = JSON.parse(readFileSync('./package.json').toString());
  if (!('releases' in packageJson)) {
    warning('Missing attribute in package.json: `release_download`');
    return;
  }

  const cacheRepositories = {};

  const releases = Object.entries(packageJson.releases);

  for (let i = 0; i < releases.length; i++) {
    const [outFile, target] = releases[i] as [string, string];
    const [_, repository, version] = target.split(/[:|#]/, 3);
    const [owner, workspace] = repository.split('/', 2);

    // TODO: handle different platform?

    debug(`ORG_WORKSPACE: ${owner}`);
    debug(`WORKSPACE: ${workspace}`);

    const cacheKey = `${repository}-${version}`;
    if (!cacheRepositories[cacheKey]) {
      const res = await model.getReleaseForTag(owner, workspace, version);
      cacheRepositories[cacheKey] = res;
    }

    const release = cacheRepositories[cacheKey];
    const targetFile = `${outFile}-${version}.zip`;

    let asset: ReleaseAsset | null = null;
    for (let x = 0; x < release?.assets.length; x++) {
      if (release.assets[x].name === targetFile) {
        asset = release.assets[x] as ReleaseAsset;
        break;
      }
    }

    if (!asset) {
      warning(`No file found for: ${targetFile} in "${repository}"`);
      continue;
    }

    const download = (await model.downloadRelease(
      owner,
      workspace,
      asset.id
    )) as ArrayBufferLike;

    if (config.extract) {
      // make dir if not exists and its a custom target
      if (config.outdir !== '.') {
        mkdirSync(config.outdir, { recursive: true });
      }

      // get current working directory
      let cwd = process.cwd();
      debug(`CWD: ${cwd}`);
      writeFileSync(join(cwd, targetFile), Buffer.from(download));
      debug('Write file to disk before extraction: ' + join(cwd, targetFile));

      let unzipOpts = ['-o', join(cwd, targetFile)];
      if (config.outdir !== '.') {
        unzipOpts = ['-o', '-d', config.outdir, join(cwd, targetFile)];
      }

      await exec('unzip', unzipOpts);
      rmSync(targetFile);
    }
    // when we do not want to extract, but download the zip file into a certain location
    else {
      debug('Create `outdir` if not exists');
      // make dir if not exists
      mkdirSync(config.outdir, { recursive: true });

      writeFileSync(`${config.outdir}/${targetFile}`, Buffer.from(download));
      debug(
        'Wrote file to location on disk: ' + `${config.outdir}/${targetFile}`
      );
    }
  }
}

run();
