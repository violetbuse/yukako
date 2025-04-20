#!/bin/bash

# install capnp-es
npx nypm install capnp-es

# generate the capnp files
npx capnp-es workerd/workerd.capnp -ots

# move workerd/workerd.ts to src/generated/workerd.ts
mkdir -p src/generated
rm -rf src/generated/workerd.ts
mv workerd/workerd.ts src/generated/workerd.ts