FROM debian:8.4

RUN apt-get -yy update && apt-get install -y curl && apt-get install -y netcat-traditional

RUN curl -sL https://deb.nodesource.com/setup_5.x | bash - && \
        apt-get install -y nodejs && \
        npm install -g grunt-cli
