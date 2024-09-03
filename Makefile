# Define the necessary environment variables
export NODE_OPTIONS="--max_old_space_size=4096"

# Target for building the frontend
build-frontend:
	cd frontend && npm install --legacy-peer-deps
	cd frontend && npm ci --loglevel verbose --userconfig npmrc --max-old-space-size=16096 --legacy-peer-deps
	cd frontend && npm run build --userconfig npmrc --max-old-space-size=16096

# Target for running the application using Docker Compose
up: 
	build-frontend
	docker-compose -f docker-compose.local.yml up

# Target installing frontend and backend dependencies for local development
install-local:
	pip install --requirement backend/requirements.txt
	cd frontend && npm install --legacy-peer-deps

# Target for running the backend and frontend locally
run-local:
	cd backend && uvicorn api.routes:app --reload &
	cd frontend && npm start
