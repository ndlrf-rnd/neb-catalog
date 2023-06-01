#!/bin/bash

set -ex

cd /tmp/
wget https://github.com/facebookresearch/fastText/archive/v0.9.2.zip
unzip v0.9.2.zip
cd '/tmp/fastText-0.9.2/'
mkdir build && cd build && cmake ..
make && make install