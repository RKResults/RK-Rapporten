############ bouwen ############
FROM node:20-bookworm-slim AS bouwer
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

############ draaien ############
FROM node:20-bookworm-slim AS draaien
WORKDIR /app

# Chromium voor het maken van de pdf, plus Carlito (vrije variant van Calibri)
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      fonts-crosextra-carlito \
      fonts-liberation \
      fonts-dejavu-core \
      ca-certificates \
      tini \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    CHROMIUM_PATH=/usr/bin/chromium \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=bouwer /app/public ./public
COPY --from=bouwer /app/.next/standalone ./
COPY --from=bouwer /app/.next/static ./.next/static

EXPOSE 3000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
