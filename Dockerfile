﻿FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./package.json /usr/src/app/
RUN npm install
COPY ./server.js /usr/src/app/
CMD [ "npm", "start" ]
