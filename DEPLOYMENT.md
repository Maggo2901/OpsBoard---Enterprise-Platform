# Deployment Guide for OpsBoard Enterprise Platform (Podman)

This guide walks you through deploying the OpsBoard application on an Oracle Linux 8.10 VM using Podman.

## Prerequisites

- Oracle Linux 8.10 VM
- Root or sudo access
- `podman` and `podman-compose` installed

### 1. Install Podman (if not present)

```bash
sudo dnf install -y podman
# For podman-compose (Python based wrapper)
sudo dnf install -y python3-pip
sudo pip3 install podman-compose
```

## Deployment Steps

### 1. Copy Project to VM

On your local machine, zip the project (excluding `node_modules`):

```bash
# In the parent folder of 'test' (or 'opsboard-enterprise')
tar --exclude='node_modules' --exclude='.git' -czf opsboard-enterprise.tar.gz test/
scp opsboard-enterprise.tar.gz user@<VM-IP>:/home/user/
```

### 2. SSH into VM and Extract

```bash
ssh user@<VM-IP>
tar -xzf opsboard-enterprise.tar.gz
cd test
```

### 3. Configure Environment

Copy the example env file:

```bash
cp .env.production.example .env
```

**Edit .env**:
```bash
nano .env
```
Set host ports and `CORS_ORIGIN` consistently (replace with your VM IP/domain):
`FRONTEND_HOST_PORT=9010`
`BACKEND_HOST_PORT=9015`
`CORS_ORIGIN=http://192.168.1.50:9010`

### 4. Build and Run

```bash
# Build containers
podman-compose build

# Start in background
podman-compose up -d
```

### 5. Verify Running Containers

```bash
podman ps
```

You should see `opsboard-enterprise-backend` and `opsboard-enterprise-frontend` running.

### 6. Access the Application

Open your browser and navigate to:
`http://<VM-IP>:9010`

## Troubleshooting

**View Logs:**
```bash
podman logs -f opsboard-enterprise-backend
podman logs -f opsboard-enterprise-frontend
```

**Restart Services:**
```bash
podman-compose restart
```

**Data Persistence:**
Data is stored in named volumes `opsboard-enterprise-data` and `opsboard-enterprise-uploads`.
To inspect:
```bash
podman volume inspect opsboard-enterprise-data
```

## Security Note

- The app is currently served over HTTP on `FRONTEND_HOST_PORT` (default `9010`).
- For production use exposed to the internet, put a reverse proxy (like system Nginx or Traefik) in front to handle SSL (HTTPS).
