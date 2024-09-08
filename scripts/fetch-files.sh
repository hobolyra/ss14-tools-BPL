#!/usr/bin/env bash
set -eu

# Set to script directory.
cd "$(dirname "$0")"

rm -r out || true
mkdir out

# Chemicals. We only care about chemicals used for medicine.
wget -P out https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/chemicals.yml
node yaml-to-json.js out/chemicals.yml out/chemicals.json
cat out/chemicals.json | node json-filter.js Ammonia,Diethylamine,Phenol,Acetone,SulfuricAcid,TableSalt,UnstableMutagen,Oil,Ephedrine,SodiumCarbonate,Benzene,Hydroxide,SodiumHydroxide,Fersilicite > out/chemicals-filtered.json

wget -P out https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/medicine.yml
node yaml-to-json.js out/medicine.yml out/medicine.json

node json-combine.js out/medicine.json out/chemicals-filtered.json > out/medicine-chemicals.json
mv out/medicine-chemicals.json ../chemist/data.json

wget -P out https://raw.githubusercontent.com/space-wizards/space-station-14/master/Resources/Prototypes/Recipes/Reactions/drinks.yml
node yaml-to-json.js out/drinks.yml out/data.json
mv out/data.json ../bartender/data.json

echo "Cleaning up"
rm -r out
