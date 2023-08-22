build-frontend:	
	export NODE_OPTIONS="--max-old-space-size=8192"
	cd frontend; npm install --legacy-peer-deps
	cd frontend; npm ci --loglevel verbose --userconfig npmrc --max-old-space-size=16096 -legacy-peer-deps
	cd frontend; npm run build --userconfig npmrc --max-old-space-size=16096

up:
	make build-frontend
	docker-compose -f docker-compose.local.yml up