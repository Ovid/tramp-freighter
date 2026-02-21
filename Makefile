.PHONY: all build test lint format clean open dev preview knip

all: lint format build test

build:
	npm run build

test:
	npm test

lint:
	npm run lint:fix

format:
	npm run format:write

clean:
	npm run clean

open: dev

dev:
	npm run dev -- --open

preview: build
	npm run preview -- --open

knip:
	npm run knip
