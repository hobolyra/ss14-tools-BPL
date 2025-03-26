#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');  // Assuming we use `js-yaml` to parse YAML

const scriptDir = __dirname;



main()
  .then(r => console.log("done"))


async function main() {
  // Process chemicals.yml
  const chemicalsUrl = 'https://raw.githubusercontent.com/Simple-Station/Einstein-Engines/master/Resources/Prototypes/Recipes/Reactions/chemicals.yml';
  const medicineReagentsUrl = 'https://raw.githubusercontent.com/Simple-Station/Einstein-Engines/master/Resources/Prototypes/Reagents/medicine.yml';

  

  const chemicalsYaml = await get(chemicalsUrl)
  const chemicalsData = yamlToJson(chemicalsYaml);
  // We only care about chemicals that contribute to medicine.
  const filteredChemicals = filterArrayById(chemicalsData, ['Ammonia', 'Diethylamine', 'Phenol', 'Acetone', 'SulfuricAcid', 'TableSalt', 'UnstableMutagen', 'Oil', 'Ephedrine', 'SodiumCarbonate', 'Benzene', 'Hydroxide', 'SodiumHydroxide', 'Fersilicite']);

  // Process medicine reagents
  const medicineReagentsYaml = await get(medicineReagentsUrl)
  const medicineReagentsData = yamlToJson(medicineReagentsYaml);

  // Process medicine.yml
  const medicineUrl = 'https://raw.githubusercontent.com/Simple-Station/Einstein-Engines/master/Resources/Prototypes/Recipes/Reactions/medicine.yml';
  const medicineYaml = await get(medicineUrl)
  const medicineData = yamlToJson(medicineYaml);

  // Combine medicine data with reagents data
  const medicineWithEffects = medicineData.map(recipe => {
    // Find matching reagent data for each product
    const productsWithEffects = recipe.products ? recipe.products.map(product => {
      const reagentData = medicineReagentsData.find(r => r.id === product.id);
      return {
        ...product,
        reagentData: reagentData
      };
    }) : [];

    return {
      ...recipe,
      products: productsWithEffects
    };
  });

  const chemistData = medicineWithEffects.concat(filteredChemicals)
  const chemistJsonPath = path.join(scriptDir, '../chemist/data.json');
  writeJsonFile(chemistData, chemistJsonPath);

  // Process drinks.yml
  const drinksUrl = 'https://raw.githubusercontent.com/Simple-Station/Einstein-Engines/master/Resources/Prototypes/Recipes/Reactions/drinks.yml';
  const drinksDeltaUrl = 'https://raw.githubusercontent.com/Simple-Station/Einstein-Engines/master/Resources/Prototypes/DeltaV/Recipes/Reactions/drinks.yml';
  const drinksYaml = await get(drinksUrl)
  const drinksData = yamlToJson(drinksYaml);
  
  // Process delta drinks
  const drinkDeltaYaml = await get(drinksDeltaUrl)
  const drinkDeltaData = yamlToJson(drinkDeltaYaml);
  
   // Combine drinks data
  const drinksDataMerge = drinksData.concat(drinkDeltaData)
  const drinksJsonPath = path.join(scriptDir, '../bartender/data.json');
  writeJsonFile(drinksDataMerge, drinksJsonPath);
}

async function get(url) {
  console.log("Making request to " + url)
  const response = await fetch(url)
  return await response.text()
}


function yamlToJson(yamlContent) {
  function convertToArray(obj) {
    if (!obj) return [];
    return Object.keys(obj).map(key => ({
      id: key,
      ...obj[key]
    }));
  }

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

  // Check if this is reagent data (has metabolisms) or recipe data (has reactants/products)
  const isReagentData = data.some(entry => entry.metabolisms);
  
  if (isReagentData) {
    return data.map(cleanReagentData);
  }

  // Process as recipe data
  const cleanedData = data.map(entry => {
    return {
      ...entry,
      reactants: convertToArray(entry.reactants),
      products: convertProductsToArray(entry.products)
    };
  });

  return cleanedData;
}

function cleanReagentData(reagent) {
    // Keep only the essential fields
    const { id, metabolisms, plantMetabolism, worksOnTheDead } = reagent;
    const cleaned = { id };
    
    if (metabolisms) {
        // Clean up metabolisms by removing !type: prefix from effects
        const cleanedMetabolisms = {};
        Object.entries(metabolisms).forEach(([key, value]) => {
            if (value.effects) {
                cleanedMetabolisms[key] = {
                    ...value,
                    effects: value.effects.map(effect => {
                        const cleanedEffect = {
                            ...effect,
                            type: effect.type.replace('!type:', '')
                        };
                        
                        // Clean conditions if they exist
                        if (effect.data?.conditions) {
                            cleanedEffect.data = {
                                ...effect.data,
                                conditions: effect.data.conditions.map(condition => ({
                                    ...condition,
                                    type: condition.type.replace('!type:', '')
                                }))
                            };
                        }
                        
                        return cleanedEffect;
                    })
                };
            } else {
                cleanedMetabolisms[key] = value;
            }
        });
        cleaned.metabolisms = cleanedMetabolisms;
    }
    
    if (plantMetabolism) {
        // Clean up plantMetabolism by removing !type: prefix
        cleaned.plantMetabolism = plantMetabolism.map(effect => ({
            ...effect,
            type: effect.type.replace('!type:', '')
        }));
    }
    if (worksOnTheDead) cleaned.worksOnTheDead = worksOnTheDead;
    
    return cleaned;
  }

function filterArrayById(array, keys) {
  return array.filter(item => keys.includes(item.id));
}

// Helper to write JSON data to file
function writeJsonFile(jsonObject, filePath) {
  console.log("writing to " + filePath)
  fs.writeFileSync(filePath, JSON.stringify(jsonObject));
}


