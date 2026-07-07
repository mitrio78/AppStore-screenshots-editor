# Screenshot Studio — production image for a VDS.
#
#   docker build -t screenshot-studio .
#   docker run -d -p 3000:3000 \
#     -v "$PWD/projects:/app/projects" \
#     -v "$PWD/public/screenshots:/app/public/screenshots" \
#     -v "$PWD/public/fonts:/app/public/fonts" \
#     screenshot-studio
#
# The three volumes hold everything the app writes at runtime (project JSON,
# uploaded screenshots, uploaded fonts + manifest). The write APIs have no
# auth — bind to localhost or put the container behind a reverse proxy with
# basic auth.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# Standalone output bundles the server + minimal node_modules.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/projects ./projects
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "server.js"]
