/* 发布前预创建 GitHub Release，避免 electron-builder 并发创建导致 422 */
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const publish = Array.isArray(pkg.build.publish) ? pkg.build.publish[0] : pkg.build.publish;
const token = process.env.GH_TOKEN;

if (!token) {
  console.error('缺少 GH_TOKEN 环境变量');
  process.exit(1);
}

const tag = 'v' + pkg.version;
const api = 'https://api.github.com/repos/' + publish.owner + '/' + publish.repo + '/releases';
const headers = {
  Authorization: 'Bearer ' + token,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'duanju-studio'
};

async function findRelease() {
  const res = await fetch(api + '/tags/' + tag, { headers });
  return res.ok;
}

async function main() {
  if (await findRelease()) {
    console.log('[release] ' + tag + ' 已存在，继续上传');
    return;
  }

  const res = await fetch(api, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify({ tag_name: tag, name: tag, draft: false, prerelease: false })
  });

  if (res.ok) {
    console.log('[release] 已创建 ' + tag);
    return;
  }

  if (await findRelease()) {
    console.log('[release] ' + tag + ' 已由其他进程创建，继续上传');
    return;
  }

  console.error('[release] 创建 ' + tag + ' 失败：' + res.status + ' ' + (await res.text()));
  process.exit(1);
}

main().catch(function (err) {
  console.error('[release] ' + err.message);
  process.exit(1);
});
