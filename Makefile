.PHONY: all build test cover lint format clean open dev preview knip deploy help

all: lint format build test ## Lint, format, build, and test

build: ## Build production bundle to dist/
	VITE_BASE_PATH=$(or $(BASE_PATH),/) npm run build

test: ## Run full test suite
	npm test

cover: ## Generate code coverage report (one-shot)
	npm run test:coverage -- --run

lint: ## Run ESLint with autofix
	npm run lint:fix

format: ## Run Prettier formatter
	@output=$$(npm run format:write --silent 2>&1); \
	changed=$$(echo "$$output" | grep -cv '(unchanged)' || true); \
	total=$$(echo "$$output" | wc -l | tr -d ' '); \
	echo "Prettier: $$changed changed, $$total files checked"

clean: ## Lint + format all files
	npm run clean

open: dev ## Alias for dev

dev: ## Start dev server and open browser
	npm run dev -- --open

preview: build ## Build then preview production bundle
	npm run preview -- --open

knip: ## Find unused exports and dependencies
	npm run knip

deploy: ## Build and deploy to a static site directory
ifndef DEPLOY_DIR
	$(error DEPLOY_DIR is required. Usage: make deploy DEPLOY_DIR=/path/to/site BASE_PATH=/url/prefix/)
endif
ifndef BASE_PATH
	$(error BASE_PATH is required. Usage: make deploy DEPLOY_DIR=/path/to/site BASE_PATH=/url/prefix/)
endif
	$(MAKE) build BASE_PATH=$(BASE_PATH)
	@mkdir -p $(DEPLOY_DIR)
	cp -r dist/* $(DEPLOY_DIR)/
	@echo "Deployed to $(DEPLOY_DIR) with base path $(BASE_PATH)"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'
