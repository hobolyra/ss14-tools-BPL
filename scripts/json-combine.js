const fs = require('fs');
const path = require('path');


const [, , file1, file2] = process.argv;

if (!file1 || !file2) {
  console.error('Usage: node json-combine.js <file1> <file2>');
  process.exit(1);
}

// Resolve absolute paths
const file1Path = path.resolve(file1);
const file2Path = path.resolve(file2);

try {
  const file1Data = fs.readFileSync(file1Path, 'utf8');
  const file1Json = JSON.parse(file1Data);

  const file2Data = fs.readFileSync(file2Path, 'utf8');
  const file2Json = JSON.parse(file2Data);

  const combined = file1Json.concat(file2Json);

  const json = JSON.stringify(combined, null, 2);
  console.log(json);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

