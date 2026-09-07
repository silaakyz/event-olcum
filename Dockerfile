FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3100
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD node -e "require('http').get('http://127.0.0.1:3100', res => { process.exit(res.statusCode===200?0:1); }).on('error', () => process.exit(1));"
CMD ["npm", "run", "start", "--", "-p", "3100"]
