COMPOSE = docker compose -f docker/docker-compose.yml

.PHONY: up down build logs ps seed-admin

## Start all services (builds if needed)
up:
	$(COMPOSE) up -d

## Stop all services
down:
	$(COMPOSE) down

## Force rebuild all images then start
build:
	$(COMPOSE) up -d --build

## Rebuild a single service:  make rebuild s=api
rebuild:
	$(COMPOSE) up -d --build $(s)

## Tail logs (all services or: make logs s=api)
logs:
	$(COMPOSE) logs -f $(s)

## Show running containers
ps:
	$(COMPOSE) ps

## Create the default admin account (run once after first `make up`)
seed-admin:
	$(COMPOSE) exec api bun /app/dist/scripts/seed-admin.js || \
	  MONGODB_URI=mongodb://localhost:27017/mentor-app bun run apps/api/src/scripts/seed-admin.ts
