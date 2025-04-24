#!/bin/bash

# install jq if not installed
if ! command -v jq &> /dev/null; then
    sudo apt-get install -y jq
fi

# install gunzip if not installed
if ! command -v gunzip &> /dev/null; then
    sudo apt-get install -y gunzip
fi

# install curl if not installed
if ! command -v curl &> /dev/null; then
    sudo apt-get install -y curl
fi

# workerd directory
WORKERD_DIR="workerd"

#reset the workerd directory
rm -rf $WORKERD_DIR
mkdir -p $WORKERD_DIR

# temp directory
TEMP_DIR=$(mktemp -d)

#download capnp https://capnproto.org/capnproto-c++-1.1.0.tar.gz
curl -L https://capnproto.org/capnproto-c++-1.1.0.tar.gz -o $TEMP_DIR/capnproto-c++-1.1.0.tar.gz
tar -xzf $TEMP_DIR/capnproto-c++-1.1.0.tar.gz -C $TEMP_DIR

# from the capnproto directory, copy the /src/capnp/ folder to the workerd/capnp/ directory
# old command copied the whole dir: cp -r $TEMP_DIR/capnproto-c++-1.1.0/src/capnp $WORKERD_DIR/capnp

# copy capnp/c++.capnp to workerd/capnp/c++.capnp
mkdir -p $WORKERD_DIR/capnp
cp $TEMP_DIR/capnproto-c++-1.1.0/src/capnp/c++.capnp $WORKERD_DIR/capnp/c++.capnp

# download the workerd schema
curl -L https://github.com/cloudflare/workerd/raw/main/src/workerd/server/workerd.capnp -o $WORKERD_DIR/workerd.capnp

# in workerd.capnp, replace the absolute import "/capnp/c++.capnp" with the relative import "capnp/c++.capnp"
sed -i 's|import "/capnp/c++.capnp"|import "capnp/c++.capnp"|' $WORKERD_DIR/workerd.capnp

# download the workerd types
curl -L https://raw.githubusercontent.com/cloudflare/workers-sdk/refs/heads/main/packages/miniflare/src/runtime/config/workerd.ts -o $WORKERD_DIR/types.ts

# get latest release version
LATEST_RELEASE=$(curl -s https://api.github.com/repos/cloudflare/workerd/releases/latest | jq -r '.tag_name')

#print workerd release version
echo "Latest workerd release version: $LATEST_RELEASE"

# download the binaries
BINARY_NAMES=("workerd-darwin-64.gz" "workerd-darwin-arm64.gz" "workerd-linux-64.gz" "workerd-linux-arm64.gz" "workerd-windows-64.gz")

for BINARY in "${BINARY_NAMES[@]}"; do
    curl -L "https://github.com/cloudflare/workerd/releases/download/$LATEST_RELEASE/$BINARY" -o "$WORKERD_DIR/$BINARY"
done

# extract the binaries
for BINARY in "${BINARY_NAMES[@]}"; do
    gunzip "$WORKERD_DIR/$BINARY"
done

# make the binaries executable
chmod +x "$WORKERD_DIR/workerd-darwin-64"
chmod +x "$WORKERD_DIR/workerd-darwin-arm64"
chmod +x "$WORKERD_DIR/workerd-linux-64"
chmod +x "$WORKERD_DIR/workerd-linux-arm64"
chmod +x "$WORKERD_DIR/workerd-windows-64"

# add a .exe extension to the windows binaries
mv "$WORKERD_DIR/workerd-windows-64" "$WORKERD_DIR/workerd-windows-64.exe"

# print the workerd directory
echo "Workerd directory: $WORKERD_DIR"







