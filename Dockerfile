FROM codercom/code-server:latest as code
FROM ubuntu:18.10

COPY --from=code /usr/local/bin/code-server /usr/local/bin/

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools \
	git \
	locales \
	curl \
	unzip

RUN locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

ADD ext /usr/bin/ext
ADD vsix-add /usr/bin/vsix-add

RUN mkdir -p /root/.code-server/Backups
RUN mkdir -p /root/.code-server/extensions 
RUN mkdir -p /root/.code-server/User/workspaceStorage
RUN mkdir -p /root/.code-server/globalStorage
