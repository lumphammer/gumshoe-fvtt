

# first args is the branch name
branchname=$1

# cd to directory
cd $(dirname $0)/..
pnpm add -D "fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#${branchname}"

cd packages/shared-fvtt-bits
pnpm add -D "fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#${branchname}"

cd ../investigator-fvtt-types
pnpm add -D "fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#${branchname}"

