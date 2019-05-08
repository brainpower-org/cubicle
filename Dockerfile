FROM codercom/code-server:1.939@sha256:ba40ec749fbfc6e5e5eaa53e45596f42ac3ad8beb3b8b7217daedf0af6a9bb6e AS code
FROM brainpower/code-ext

COPY --from=code /usr/local/bin/code-server /usr/local/bin/

RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools \
	git \
	locales \
	curl \
	unzip \
	tar \
	nodejs \
	xterm \
	pkg-config

RUN npm install globby execa cpy yargs-parser uuid

RUN locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN ext install MS-vsliveshare.vsliveshare 1.0.125
RUN ext install karigari.chat 0.13.0
RUN ext install lostintangent.vsls-whiteboard 0.0.8

ADD . /repo
RUN node repo/activate --extension-dir /root/.local/share/code-server/extensions
