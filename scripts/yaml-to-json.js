// Yaml from: https://github.com/space-wizards/space-station-14/blob/master/Resources/Prototypes/Recipes/Reactions
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Get input and output file paths from command-line arguments
const [, , inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error('Usage: node convert-yaml-to-json.js <input.yaml> <output.json>');
  process.exit(1);
}

// Resolve absolute paths
const inputPath = path.resolve(inputFile);
const outputPath = path.resolve(outputFile);

try {
  const yamlFile = fs.readFileSync(inputPath, 'utf8');
  const data = yaml.load(yamlFile);

  const cleanedData = data.map(drink => {
    return {
      ...drink, reactants: convertToArray(drink.reactants), products: convertToArray(drink.products)
    };
  });

  const json = JSON.stringify(cleanedData, null, 2);

  fs.writeFileSync(outputPath, json, 'utf8');
  console.log(`Successfully converted YAML to JSON. Output written to ${outputPath}`);
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}


function convertToArray(obj) {
  return Object.keys(obj).map(key => ({
    id: key,
    ...obj[key]
  }));
}
