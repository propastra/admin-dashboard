const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SERVER_IP   = '16.112.176.154';
const SERVER_USER = 'ubuntu';
const REMOTE_DIR  = '/home/ubuntu/Admin_dashboard/backend';

const SSH_KEY_CONTENT = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA6f73e6RHl8zBw0omufamZfYJhgX6bacyGruFtzFMKpH+zxPr
UXkTV6m8YB1kGn9hlckxZK79rc0qEzxw0CkCHgLOZ5CPu52HHzirRwBbD2tP9YCw
9aE2Y0amhgX+AgUB/lWFq2IxBSKfHsBYbnH8tvd7cpNoYG8FiAEX7CKZH2Wy/GC/
DCi3hQluY3tHt/mhu/6PJQqfDvW1JrhUhnvQFwBAGLfZ/rVjPCRqstGCANS1AfVA
nhHK6SIbvXCXe3+hHn+sUcN0+1pTpgt0PxvsU6V+eSdOvB0feQ35SYEPxT0mx9GN
/cKLZ72UHl77G448O6+hPjMnFIhovpdk2BxvDQIDAQABAoIBAF2o6HZc8ysXkhcQ
/x9AUqpNKNK0YeCyI6P/my4QVWRUu6E3X+FkjRFxpyzxlrfkdLL3rQWX5YJDtKuu
bZlkUKyiguuBOYbnLsaYcDYjNk+drIufzzUCKjridJUAoQM97eZXZQGMdAKSMQ6l
/r92cKjrtkXOKuEujxA5H9Ispw2ha2r10LZ/K5D7HNQaka5aWLAKDqXkhz+J8f8r
fqCyI317VQKfG+oMTu6Kj7j4u/vGC23VSQTucffP8/3LL1xcRehmJZxGCRVAOmon
9+g/PQClffDHj6LT2khK90jXbtxSLQ0xaVSB3StdFpqLK1F8WN9lOEokya5sOHmS
nJYk+wECgYEA9p8m3gyF/0fJxCo74xfu/qvECroz2fmMlAt8KUT7TezZIS5UNve+
5I296r4/wv2RVNot+doEMKk2x2OOcO6ms7rR+IV713Nuv4IQMpRVA2Tb79ZOYBub
mVQHWXE9csC/05PjeFTBcJ/r1OYYa1PBhbZSPHgIH1XP0YOw/YoiUikCgYEA8uTn
efqP4lGjdowWqSn03TRFddF5MFDP75j01QXY2IRCk/djGsd82SO6mddJowTOClDW
bweXVVQfDfOdyWn91WAgLRlhP7vTYSLJgQ9XwumcNfZo0Numov20Qw6xduGouFAh
FJZkUYlW120JD7ItRAevw2d+m9E+pvG3RAInOkUCgYEA2c+8CxaybcDgYQEP/URR
Dtly/ipvyw7MaqAuG2DSNoN9TQHW3Ok3zjGlTyKRu8wpQ/Ch9G3pj3STbcvurK0J
y+iuszhpJOLNKBRd6933q1SzroHunJElfmipSQRrSeMUSG/v0YHBio+jQFerr3a8
jzR0MvWr7sjiD1+ovHP4VekCgYATz0l1sFLF0YS0aW57s3lOBTJZDpGEuEKNNvtY
2FY8KmVHrhh+GaD8EKbqXx2ZVw3612b1vTfBdM/nkmPfBm72VRWqt/Qvf4EY3f5z
MS4mLmlYGVWpGxD3IBvwkCU3HeZlyds4058w6zOS9EiV6CE6+CmElU9FJAapFPOu
b0KFxQKBgQC5P9Zbc3Il4QjePtWLyKZCssMB3tBlqZr8U4sJdu6jaVaqlYRzgiud
6gq5BD0woQDHHDTazTSTvdh4d7sLqEoJACtlneqyRdhBwnCyMVamDW1S+tTJ9HkD
zUuE/sdT+RfLMe2y7UfNZlTQfsmOiUGV7jLDnqQv2WhEPVwoh2IcsQ==
-----END RSA PRIVATE KEY-----`;

const keyFile = path.join(os.tmpdir(), `propastra_key_${Date.now()}`);
fs.writeFileSync(keyFile, SSH_KEY_CONTENT + '\n', { mode: 0o600 });
const SSH_OPTS = `-i ${keyFile} -o StrictHostKeyChecking=no`;

console.log('Using database from backup: /Users/pujithsingh/Desktop/Admin_dashboard/production-backup/backup_2026-04-17T20-33-16/database.sqlite');
const LOCAL_DB = '/Users/pujithsingh/Desktop/Admin_dashboard/production-backup/backup_2026-04-17T20-33-16/database.sqlite';

try {
  console.log('Uploading database...');
  execSync(`scp ${SSH_OPTS} ${LOCAL_DB} ubuntu@16.112.176.154:/home/ubuntu/Admin_dashboard/backend/database.sqlite`, { stdio: 'inherit' });
  
  console.log('Restarting server...');
  execSync(`ssh ${SSH_OPTS} ubuntu@16.112.176.154 "cd /home/ubuntu/Admin_dashboard/backend && npx pm2 restart backend"`, { stdio: 'inherit' });

  // verify the count on the server
  const count = execSync(`ssh ${SSH_OPTS} ubuntu@16.112.176.154 "sqlite3 /home/ubuntu/Admin_dashboard/backend/database.sqlite 'SELECT COUNT(*) FROM Properties;'"`, { encoding: 'utf-8' });
  console.log('Total properties uploaded: ' + count.trim());

} catch (err) {
  console.error('Failed', err);
} finally {
  fs.unlinkSync(keyFile);
}
