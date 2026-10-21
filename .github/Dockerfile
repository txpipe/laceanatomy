FROM node:22.23.4

COPY build-artifacts /code

WORKDIR /code/web
RUN yarn install

ENTRYPOINT [ "yarn", "run", "start" ]
