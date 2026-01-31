FROM mcr.microsoft.com/playwright:v1.58.1-jammy

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY index.js ./

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
