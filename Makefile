COMPOSE ?= docker compose

.DEFAULT_GOAL := help
.PHONY: help up up-d down build restart logs ps sh-backend sh-frontend test lint lint-backend lint-frontend format format-backend format-frontend check check-backend check-frontend typecheck typecheck-backend typecheck-frontend verify clean

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

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

test: ## Run the backend test suite
	$(COMPOSE) exec backend npm test

lint: lint-backend lint-frontend ## Lint both packages
lint-backend: ## Lint the backend
	$(COMPOSE) exec backend npm run lint
lint-frontend: ## Lint the frontend
	$(COMPOSE) exec frontend npm run lint

format: format-backend format-frontend ## Format both packages (writes files)
format-backend: ## Format the backend
	$(COMPOSE) exec backend npm run format
format-frontend: ## Format the frontend
	$(COMPOSE) exec frontend npm run format

check: check-backend check-frontend ## Check formatting for both packages
check-backend: ## Check backend formatting
	$(COMPOSE) exec backend npm run check
check-frontend: ## Check frontend formatting
	$(COMPOSE) exec frontend npm run check

typecheck: typecheck-backend typecheck-frontend ## Typecheck both packages
typecheck-backend: ## Typecheck the backend
	$(COMPOSE) exec backend npm run typecheck
typecheck-frontend: ## Typecheck the frontend
	$(COMPOSE) exec frontend npm run typecheck

verify: check lint typecheck test ## Run checks, lint, typecheck and tests

clean: ## Stop everything and delete volumes (Caddy data/config)
	$(COMPOSE) down -v
