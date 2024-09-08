const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');


// Need this stuff to handle custom (!) tags in yaml.
// From https://github.com/nodeca/js-yaml/blob/0d3ca7a27b03a6c974790a30a89e456007d62976/examples/handle_unknown_types.js
class CustomTag {
  constructor(type, data) {
    this.type = type;
    this.data = data;
  }
}

const tags = ['scalar', 'sequence', 'mapping'].map(function (kind) {
  // first argument here is a prefix, so this type will handle anything starting with !
  return new yaml.Type('!', {
    kind: kind,
    multi: true,
    representName: function (object) {
      return object.type;
    },
    represent: function (object) {
      return object.data;
    },
    instanceOf: CustomTag,
    construct: function (data, type) {
      return new CustomTag(type, data);
    }
  });
});

const schema = yaml.DEFAULT_SCHEMA.extend(tags);

// Get input and output file paths from command-line arguments
const [, , inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error('Usage: node yaml-to-json.js <input.yaml> <output.json>');
  process.exit(1);
}

// Resolve absolute paths
const inputPath = path.resolve(inputFile);
const outputPath = path.resolve(outputFile);

try {
  const yamlFile = fs.readFileSync(inputPath, 'utf8');
  const data = yaml.load(yamlFile, {schema: schema});

  const cleanedData = data.map(entry => {
    return {
      ...entry, reactants: convertToArray(entry.reactants), products: convertProductsToArray(entry.products)
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


// Obj has the form {"key": 2}.
function convertProductsToArray(obj) {
  if (!obj) {
    return []
  }
  return Object.keys(obj).map(key => ({
    id: key,
    amount: obj[key]
  }));
}
