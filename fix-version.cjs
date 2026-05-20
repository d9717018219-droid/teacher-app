const fs = require('fs');
const path = './android/app/build.gradle';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/versionCode \d+/, 'versionCode 114');
content = content.replace(/versionName ".*"/, 'versionName "1.0.114"');
fs.writeFileSync(path, content);
console.log('Updated version to 114');
