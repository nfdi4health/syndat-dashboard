build-frontend:	
	export NODE_OPTIONS="--max_old_space_size=4096"
	cd frontend; npm install --legacy-peer-deps
	cd frontend; npm ci --loglevel verbose --userconfig npmrc --max-old-space-size=16096 -legacy-peer-deps
	cd frontend; npm run build --userconfig npmrc --max-old-space-size=16096

up:
	make build-frontend
	docker-compose -f docker-compose.local.yml up

make run-local:
	cd frontend; npm start
	cd backend; uvicorn api.routes:app --reload