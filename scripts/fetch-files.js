#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');  // Assuming we use `js-yaml` to parse YAML

const scriptDir = __dirname;



main()
  .then(r => console.log("done"))


async function main() {
  // Process chemicals.yml
  const chemicalsUrl = 'https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/chemicals.yml';
  const chemicalsYaml = await get(chemicalsUrl)
  const chemicalsData = yamlToJson(chemicalsYaml);
  // We only care about chemicals that contribute to medicine.
  const filteredChemicals = filterArrayById(chemicalsData, ['Ammonia', 'Diethylamine', 'Phenol', 'Acetone', 'SulfuricAcid', 'TableSalt', 'UnstableMutagen', 'Oil', 'Ephedrine', 'SodiumCarbonate', 'Benzene', 'Hydroxide', 'SodiumHydroxide', 'Fersilicite']);

  // Process medicine.yml
  const medicineUrl = 'https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/medicine.yml';
  const medicineYaml = await get(medicineUrl)
  const medicineData = yamlToJson(medicineYaml);

  const chemistData = medicineData.concat(filteredChemicals)
  const chemistJsonPath = path.join(scriptDir, '../chemist/data.json');
  writeJsonFile(chemistData, chemistJsonPath);

  // Process drinks.yml
  const drinksUrl = 'https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/drinks.yml';
  const drinksYaml = await get(drinksUrl)
  const drinksData = yamlToJson(drinksYaml);
  const drinksJsonPath = path.join(scriptDir, '../bartender/data.json');
  writeJsonFile(drinksData, drinksJsonPath);
}

async function get(url) {
  console.log("Making request to " + url)
  const response = await fetch(url)
  return await response.text()
}


function yamlToJson(yamlContent) {
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

  const data = yaml.load(yamlContent, {schema: schema});

  const cleanedData = data.map(entry => {
    return {
      ...entry, reactants: convertToArray(entry.reactants), products: convertProductsToArray(entry.products)
    };
  });

  return cleanedData
}

function filterArrayById(array, keys) {
  return array.filter(item => keys.includes(item.id));
}

// Helper to write JSON data to file
function writeJsonFile(jsonObject, filePath) {
  console.log("writing to " + filePath)
  fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2));
}


