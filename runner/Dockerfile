# syntax=docker/dockerfile:1
# Needs /var/run/docker.sock; see README.md for why the service stays internal.
FROM node:22-alpine
RUN apk add --no-cache docker-cli
WORKDIR /runner
COPY package.json server.mjs harness.mjs ./
ENV NODE_ENV=production PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/health >/dev/null || exit 1
CMD ["node", "server.mjs"]
