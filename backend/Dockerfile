FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Create data directory structure for persistence
RUN mkdir -p data/uploads

EXPOSE 3000

CMD ["npm", "start"]
