FROM apify/actor-node:22

COPY package*.json ./

RUN npm install --include=dev

COPY tsconfig.json ./
COPY src ./src
COPY .actor ./.actor

RUN npm run build

CMD ["npm", "start"]