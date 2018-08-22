FROM node:latest

WORKDIR /usr/app

COPY . .
RUN npm i

EXPOSE 3000

CMD npm start
