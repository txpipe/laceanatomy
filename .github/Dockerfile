FROM node:20-alpine

COPY build-artifacts /code

WORKDIR /code/web
RUN yarn install

ENTRYPOINT [ "yarn", "run", "start" ]
