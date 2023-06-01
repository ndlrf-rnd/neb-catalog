#!/bin/bash

set -ex

cd /tmp/
wget https://github.com/yahoojapan/NGT/archive/v1.12.0.zip
unzip v1.12.0.zip
cd '/tmp/NGT-1.12.0'
mkdir build
cd build
cmake ..
make
make install
ldconfig /usr/local/lib
cd ..
ls -lth
