COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up up-d down build restart logs ps sh-backend sh-frontend clean

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

up: ## Build and start the full stack (foreground, Ctrl-C to stop)
	$(COMPOSE) up --build

up-d: ## Build and start the full stack in the background
	$(COMPOSE) up --build -d

down: ## Stop and remove containers/networks
	$(COMPOSE) down

build: ## Rebuild images
	$(COMPOSE) build

restart: ## Restart all services
	$(COMPOSE) restart

logs: ## Tail logs from all services
	$(COMPOSE) logs -f

ps: ## Show running services
	$(COMPOSE) ps

sh-backend: ## Shell into the backend container
	$(COMPOSE) exec backend sh

sh-frontend: ## Shell into the frontend container
	$(COMPOSE) exec frontend sh

clean: ## Stop everything and delete volumes (Caddy data/config)
	$(COMPOSE) down -v
