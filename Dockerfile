ARG BASE_CONTAINER=centos:7.9.2009
FROM ${BASE_CONTAINER}

LABEL maintainer="Ilya Kutukov <i@leninka.ru>"

ENV container docker
ARG NODE_VERSION=12.13.0
ENV NODE_VERSION=${NODE_VERSION}

USER root

RUN rpm --import http://mirror.centos.org/centos/RPM-GPG-KEY-CentOS-5

# Install OS packages
RUN yum install -y \
    gcc-c++ \
    make \
    cmake \
    pv \
    git \
    unzip \
    psmisc \
    pigz \
    pv \
    wget \
    libxslt \
  && \
  yum clean all

# Install Node.js
COPY . /home/node/

RUN ls -la /home/node/ && \
    ls -la /home/node/dockerscripts/ && \
    chmod +x /home/node/dockerscripts/*.sh && \
    /home/node/dockerscripts/setup_node_12.x.sh && \
    rm -f /home/node/dockerscripts/setup_node_12.x.sh && \
    yum install -y nodejs && \
    yum clean all && \
    npm install -g \
      node-gyp \
      forever && \
    npm cache clean --force

RUN rm -rf /home/node/node_modules && \
    groupadd -r node --gid=1000 && \
    useradd -r -g node --uid=1000 node && \
	  chown -R node:node /home/node/ && \
    cp /home/node/dockerscripts/usr/local/lib/libngt.so.1.12.1 /usr/local/lib/libngt.so && \
    chown node:node /usr/local/lib/libngt.so && \
    cp /home/node/dockerscripts/usr/bin/ngt.1.12.1 /usr/bin/ngt && \
    cp /home/node/dockerscripts/usr/bin/ngtq.1.12.1 /usr/bin/ngtq && \
    chmod +x /usr/bin/ngt && \
    chmod +x /usr/bin/ngtq && \
    chown node:node /usr/bin/ngt && \
    chown node:node /usr/bin/ngtq && \
    cp /home/node/dockerscripts/usr/bin/fasttext.0.9.1 /usr/bin/fasttext && \
    chmod +x /usr/bin/fasttext && \
    chown node:node /usr/bin/fasttext

USER node

# Heavy npm packages pre-build
RUN cd /home/node/ && \
    npm install argon2 --ignore-scripts && \
    npx node-pre-gyp rebuild -C ./node_modules/argon2

# Install application with dependencies
RUN cd /home/node/  && \
    npm install && \
    npm run build && \
    npm cache clean --force

EXPOSE 8080

ENV NODE_ENV=production
ENV NODE_ENV=production

WORKDIR  /home/node/

CMD ["./dockerscripts/entrypoint.sh"]
