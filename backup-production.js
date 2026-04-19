#!/usr/bin/env node
/**
 * PROPASTRA PRODUCTION BACKUP SCRIPT
 * Downloads the SQLite database + all uploads from the production server.
 * Run with: node backup-production.js
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SERVER_IP   = '16.112.176.154';
const SERVER_USER = 'ubuntu';
const REMOTE_DIR  = '/home/ubuntu/Admin_dashboard/backend';

const BACKUP_ROOT = path.join(__dirname, 'production-backup');
const TIMESTAMP   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_DIR  = path.join(BACKUP_ROOT, `backup_${TIMESTAMP}`);

// Write the SSH private key to a temp file
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function log(msg) { console.log(`\n✅ ${msg}`); }
function warn(msg) { console.log(`\n⚠️  ${msg}`); }
function err(msg)  { console.error(`\n❌ ${msg}`); }

function run(cmd, label) {
    console.log(`\n→ ${label || cmd}`);
    const result = spawnSync('bash', ['-c', cmd], { stdio: 'inherit' });
    if (result.status !== 0) {
        err(`Failed: ${label || cmd}`);
        process.exit(1);
    }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
console.log('='.repeat(60));
console.log('  PROPASTRA PRODUCTION BACKUP');
console.log(`  Target: ${TIMESTAMP}`);
console.log('='.repeat(60));

// 1. Write temp SSH key
const keyFile = path.join(os.tmpdir(), `propastra_key_${Date.now()}`);
fs.writeFileSync(keyFile, SSH_KEY_CONTENT + '\n', { mode: 0o600 });
log(`SSH key written to: ${keyFile}`);

// 2. Create local backup directory
fs.mkdirSync(BACKUP_DIR, { recursive: true });
fs.mkdirSync(path.join(BACKUP_DIR, 'uploads'), { recursive: true });
log(`Backup directory: ${BACKUP_DIR}`);

const SSH_OPTS = `-i ${keyFile} -o StrictHostKeyChecking=no -o ConnectTimeout=15`;

// 3. Check server connectivity
log('Connecting to production server...');
run(
    `ssh ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP} "echo 'Connected OK' && sqlite3 ${REMOTE_DIR}/database.sqlite 'SELECT COUNT(*) FROM Properties;'"`,
    'Verify connection & count properties'
);

// 4. Download SQLite database
log('Downloading database.sqlite...');
run(
    `scp ${SSH_OPTS} ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/database.sqlite ${BACKUP_DIR}/database.sqlite`,
    'Download database.sqlite'
);
log(`Database saved → ${BACKUP_DIR}/database.sqlite`);

// 5. Download all uploads (photos, brochures, floor plans, etc.)
log('Downloading all uploads (this may take a few minutes for 4500+ files)...');
run(
    `rsync -avz --progress -e "ssh ${SSH_OPTS}" ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/uploads/ ${BACKUP_DIR}/uploads/`,
    'rsync uploads from production'
);
log(`Uploads saved → ${BACKUP_DIR}/uploads/`);

// 6. Also download the persistent_data backups (safe store)
log('Downloading persistent_data (server-side backups)...');
fs.mkdirSync(path.join(BACKUP_DIR, 'server-backups'), { recursive: true });
const persistResult = spawnSync('bash', ['-c',
    `rsync -avz -e "ssh ${SSH_OPTS}" ${SERVER_USER}@${SERVER_IP}:/home/ubuntu/persistent_data/ ${BACKUP_DIR}/server-backups/ 2>&1 || true`
], { stdio: 'inherit' });
// Don't fail if persistent_data doesn't exist

// 7. Count what we got
const uploadCount = fs.readdirSync(path.join(BACKUP_DIR, 'uploads')).length;
const dbSize = (fs.statSync(path.join(BACKUP_DIR, 'database.sqlite')).size / 1024 / 1024).toFixed(2);

// Clean up key file
fs.unlinkSync(keyFile);

console.log('\n' + '='.repeat(60));
console.log('  BACKUP COMPLETE');
console.log('='.repeat(60));
console.log(`  📁 Location  : ${BACKUP_DIR}`);
console.log(`  🗃️  Database  : database.sqlite (${dbSize} MB)`);
console.log(`  🖼️  Uploads   : ${uploadCount} files`);
console.log(`  🕐 Timestamp : ${TIMESTAMP}`);
console.log('='.repeat(60));
console.log('\nTo restore: copy database.sqlite and uploads/ folder to backend/\n');
