.PHONY: all build test cover lint lint-css format clean open dev preview knip deploy loc help

all: lint format build test ## Lint, format, build, and test

build: ## Build production bundle to dist/
	VITE_BASE_PATH=$(or $(BASE_PATH),/) npm run build

test: ## Run full test suite
	npm test

cover: ## Generate code coverage report (one-shot)
	npm run test:coverage -- --run

lint: lint-css ## Run ESLint with autofix
	npm run lint:fix

lint-css: ## Forbid hardcoded pixel font-sizes in CSS
	@bash scripts/lint-css-font-sizes.sh

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

# git ls-files keeps node_modules, dist and coverage out; column 5 of cloc's CSV SUM row is code lines.
LOC_MAIN = src css scripts index.html '*.config.js' '*.config.mjs' shared-config.js
LOC_TEST = tests

loc: ## Count lines of code (main, tests, total) in our own tracked files
	@main=$$(git ls-files $(LOC_MAIN) | cloc --list-file=- --quiet --csv | awk -F, '$$2=="SUM"{print $$5}'); \
	test=$$(git ls-files $(LOC_TEST) | cloc --list-file=- --quiet --csv | awk -F, '$$2=="SUM"{print $$5}'); \
	printf "  %-6s %7d\n" Main "$$main" Tests "$$test" Total "$$((main + test))"

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-10s %s\n", $$1, $$2}'
