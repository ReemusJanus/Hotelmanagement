FROM node:26.0.0-alpine
RUN npm install --global npm@11.12.1 \
    && test "$(node --version)" = "v26.0.0" \
    && test "$(npm --version)" = "11.12.1"
WORKDIR /app
COPY package*.json ./
COPY scripts ./scripts
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
