FROM node:argon
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY app/package.json /usr/src/app/
RUN npm install
COPY app/ /usr/src/app/
CMD [ "npm", "start" ]
