FROM node:24.18.1-alpine
RUN npm install --global npm@11.16.0 \
    && test "$(node --version)" = "v24.18.1" \
    && test "$(npm --version)" = "11.16.0"
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
