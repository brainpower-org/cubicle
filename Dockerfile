FROM codercom/code-server:1.939 AS code
FROM brainpower/code-ext

COPY --from=code /usr/local/bin/code-server /usr/local/bin/

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools \
	git \
	locales \
	curl \
	unzip \
	tar \
	nodejs \
	npm \
	xterm

RUN npm install globby execa cpy yargs-parser uuid

RUN locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

RUN ext install MS-vsliveshare.vsliveshare 1.0.91
RUN ext install karigari.chat 0.13.0
RUN ext install lostintangent.vsls-whiteboard 0.0.8

RUN cp -r /user /root/.code-server/

ADD . /repo
RUN node repo/activate --extension-dir /ext

RUN mkdir -p /root/.code-server/extensions/
RUN cp -r /ext/* /root/.code-server/extensions/
