const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

function request(hostname, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const opts = { hostname, method, path, headers: { 'Content-Type': 'application/json' } };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  // Step 1: 登录 npm registry（CouchDB 风格）
  const user = 'mz5230';
  const pass = '18282018147';
  const email = '1521530770@qq.com';
  const loginBody = { name: user, password: pass, email, _id: 'org.couchdb.user:' + user, type: 'user', roles: [] };
  
  console.log('Logging in...');
  const res = await request('registry.npmjs.org', 'PUT', '/-/user/org.couchdb.user:' + encodeURIComponent(user), loginBody);
  console.log('Status:', res.status);
  
  let j;
  try { j = JSON.parse(res.body); } catch (e) { console.log('Parse fail:', res.body.slice(0, 500)); return; }
  console.log('Response:', JSON.stringify(j).slice(0, 300));
  
  // Step 2: 如果登录成功，获取 token 并写入 .npmrc
  let token = j.token;
  if (!token && j.session && j.session.token) token = j.session.token;
  
  if (token) {
    const npmrcPath = path.join(os.homedir(), '.npmrc');
    const npmrc = '//registry.npmjs.org/:_authToken=' + token + '\nregistry=https://registry.npmjs.org/\n';
    fs.writeFileSync(npmrcPath, npmrc, 'utf-8');
    console.log('Token saved to', npmrcPath);
    
    // Step 3: 验证 whoami
    const who = await request('registry.npmjs.org', 'GET', '/-/whoami');
    console.log('whoami:', who.body);
    
    // Step 4: publish
    process.stdout.write('Ready to publish. Run: npm publish');
  } else if (j.ok) {
    console.log('Login ok but no token found, checking auth headers...');
    console.log('Headers:', JSON.stringify(res.headers));
  } else {
    console.log('Login failed:', res.body.slice(0, 500));
  }
})();