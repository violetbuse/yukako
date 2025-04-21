#!/bin/bash

# install capnp-es
npx nypm install capnp-es

# generate the capnp files
npx capnp-es workerd/workerd.capnp -ots

# move workerd/workerd.ts to src/generated/workerd.ts
mkdir -p src/generated
rm -rf src/generated/workerd.ts
mv workerd/workerd.ts src/generated/workerd_capnp.ts

# move workerd/types.ts to src/generated/workerd_types.ts
rm -rf src/generated/workerd_types.ts
mv workerd/types.ts src/generated/workerd_types.ts

# in workerd_types replace "from "./generated" with "from "./workerd_capnp""
sed -i 's|from "./generated"|from "./workerd_capnp"|' src/generated/workerd_types.ts
