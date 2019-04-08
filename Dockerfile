FROM codercom/code-server:latest as code
FROM ubuntu:18.10

COPY --from=code /usr/local/bin/code-server /usr/local/bin/

RUN apt-get update && apt-get install -y \
	openssl \
	net-tools \
	git \
	locales \
	curl \
	unzip \
	tar

RUN locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

ADD ext /usr/bin/ext
ADD vsix-add /usr/bin/vsix-add

RUN mkdir -p /root/.code-server/Backups
RUN mkdir -p /root/.code-server/extensions 
RUN mkdir -p /root/.code-server/User/workspaceStorage
RUN mkdir -p /root/.code-server/globalStorage

RUN ext install MS-vsliveshare.vsliveshare-pack 0.2.10
RUN ext install MS-vsliveshare.vsliveshare 1.0.18

RUN curl https://download.visualstudio.microsoft.com/download/pr/05a71d80-3e59-4f1f-8298-2697013e261c/be191f2f4f4db74c29030008ed3632f0/dotnet-runtime-2.1.5-linux-x64.tar.gz \
	-o dotnet-runtime-2.1.5-linux-x64.tar.gz
RUN tar -xzvf dotnet-runtime-2.1.5-linux-x64.tar.gz --strip-components=4 -C ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/dotnet_modules/
RUN rm dotnet-runtime-2.1.5-linux-x64.tar.gz
RUN cp -r ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/dotnet_modules/runtimes/linux-x64/* ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/dotnet_modules/
RUN cp -r ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/dotnet_modules/runtimes/linux-x64/native/* ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/dotnet_modules/
RUN sh ~/.code-server/extensions/MS-vsliveshare.vsliveshare-1.0.18/out/deps/linux-prereqs.sh