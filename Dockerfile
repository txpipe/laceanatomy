FROM node:20-alpine

WORKDIR /code

COPY ./yarn.lock ./yarn.lock

COPY ./napi-pallas/package.json ./napi-pallas/package.json
COPY ./web/package.json ./web/package.json

RUN yarn install

COPY . ./

RUN yarn workspaces run build

WORKDIR /code/web

ENTRYPOINT [ "yarn", "run", "start" ]
