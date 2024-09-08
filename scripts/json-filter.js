#!/usr/bin/env node
const fs = require('fs');

// Get input and output file paths from command-line arguments
const [, , filter] = process.argv;

if (!filter) {
  console.error('Usage: node json-filter.js <filter>');
  process.exit(1);
}

var filterArr = filter.split(",")

var stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
var json = JSON.parse(stdinBuffer.toString())

var filtered = json.filter(item => filterArr.includes(item.id))

console.log(JSON.stringify(filtered))
