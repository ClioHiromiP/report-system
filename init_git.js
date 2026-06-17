#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

async function walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === '.git' || e.name === 'node_modules') continue;
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile()) {
      files.push(full);
    }
  }
  return files;
}

async function run() {
  const dir = process.cwd();
  const authorName = process.env.GIT_AUTHOR_NAME || process.env.USER || 'Report Bot';
  const authorEmail = process.env.GIT_AUTHOR_EMAIL || 'report@example.com';
  const token = process.env.GIT_TOKEN;
  const username = process.env.GIT_USERNAME || 'x-access-token';
  const remoteUrl = process.env.GIT_REMOTE || 'https://github.com/ClioHiromiP/report-system';

  if (!token) {
    console.error('ERROR: Set the GIT_TOKEN environment variable (a GitHub personal access token).');
    process.exit(1);
  }

  await git.init({ fs, dir, defaultBranch: 'main' });

  const allFiles = await walk(dir);
  for (const f of allFiles) {
    const rel = path.relative(dir, f).replace(/\\/g, '/');
    try {
      await git.add({ fs, dir, filepath: rel });
    } catch (e) {
      // ignore individual add errors
    }
  }

  const sha = await git.commit({
    fs,
    dir,
    message: 'Initial commit',
    author: { name: authorName, email: authorEmail },
  });
  console.log('Created commit', sha);

  try {
    await git.addRemote({ fs, dir, remote: 'origin', url: remoteUrl, force: true });
  } catch (e) {
    // ignore if remote exists
  }

  console.log('Pushing to', remoteUrl);
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    onAuth: () => ({ username, password: token }),
  });

  console.log('Push complete');
}

run().catch(err => { console.error(err); process.exit(1); });
