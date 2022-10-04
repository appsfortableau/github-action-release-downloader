# Releaser

This Github action created by Infotopics | Apps for tableau for downloading release assets from repositories.
Mainly developed for `YSNP` and constructions like `nb` (non-binary repositories) or for reusing release assets else where.

## Inputs

**`outdir`**  
Where to download the zip into. Whenever `extract` is `true` it will be the target path of extraction.

**`extract`**  
Extract to zip file into the `outdir` location. E.g. outdir=extensions the zip file: super-tables-free-4.0.0.zip will be extracted as `extensions/super-tables-free`.

**`token`**  
Authorized secret GitHub Personal Access Token. Defaults to `github.token`.

**`fail-on-warning`**  
Returns a error when a warning occurs instead of a warning.

## Example usage

Within the `package.json` there should be a section like:

```json
  "releases": {
     "super-tables-free": "github.com:appsfortableau/supertables#4.0.0",
     "super-tables-sandbox": "github.com:appsfortableau/supertables#4.0.0"
  }
```
> The `super-tables-free` relates to the `asset(s)` found for release `4.0.0` in the `appsfortableau/supertables` repository.  
> Name of the zip that will be searched for: `super-tables-free-4.0.0.zip`.


Following in your github action:

```yaml
uses: appsfortableau/github-action-release-downloader@v1
with:
  extract: true
  outdir: extensions
```
or without extracting and download zip's too the extensions folder:
```yaml
uses: appsfortableau/github-action-release-downloader@v1
with:
  outdir: extensions
```

## Usefull links

- [creating a javscript action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [using release management for actions](https://docs.github.com/en/actions/creating-actions/about-custom-actions#using-release-management-for-actions)
- [inspirate and copied code from: `softprops/action-gh-release`](https://github.com/softprops/action-gh-release)
- [more inspiration: `action/github-script`](https://github.com/actions/github-script)
