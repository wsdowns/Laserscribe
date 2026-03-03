# Deployment Guide - GitHub Actions to AWS Lightsail

This guide explains how to set up automated deployment from GitHub to your AWS Lightsail server.

## Prerequisites

- AWS Lightsail instance running Ubuntu
- SSH access to your Lightsail instance
- GitHub repository with Actions enabled

## Server Setup (One-time)

### 1. Create deployment directory on Lightsail

```bash
ssh ubuntu@your-lightsail-ip
sudo mkdir -p /opt/laserscribe
sudo chown ubuntu:ubuntu /opt/laserscribe
```

### 2. Install systemd service

Copy the service file to your server:

```bash
scp backend/laserscribe.service ubuntu@your-lightsail-ip:/tmp/
```

On the server, install the service:

```bash
sudo mv /tmp/laserscribe.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable laserscribe
```

### 3. Create environment file

Create `/opt/laserscribe/.env` on the server with your configuration:

```bash
sudo nano /opt/laserscribe/.env
```

Add your environment variables:

```env
PORT=8080
DB_PATH=/opt/laserscribe/laserscribe.db
JWT_SECRET=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@laserscribed.com
```

Set proper permissions:

```bash
sudo chmod 600 /opt/laserscribe/.env
sudo chown ubuntu:ubuntu /opt/laserscribe/.env
```

## GitHub Secrets Setup

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Required Secrets

1. **LIGHTSAIL_SSH_KEY**
   - Your private SSH key for accessing the Lightsail instance
   - Generate if needed: `ssh-keygen -t ed25519 -C "github-actions"`
   - Copy private key: `cat ~/.ssh/id_ed25519`
   - Add public key to server: `ssh-copy-id ubuntu@your-lightsail-ip`

2. **LIGHTSAIL_HOST**
   - Your Lightsail instance IP or domain
   - Example: `12.34.56.78` or `laserscribed.com`

3. **LIGHTSAIL_USER**
   - SSH username (usually `ubuntu` for Ubuntu instances)
   - Example: `ubuntu`

4. **LIGHTSAIL_DEPLOY_PATH**
   - Deployment directory path on the server
   - Example: `/opt/laserscribe`

## How It Works

The GitHub Actions workflow (`deploy.yml`) automatically:

1. **Triggers** on:
   - Push to `main` branch (when backend files change)
   - Manual workflow dispatch

2. **Build Process**:
   - Checks out code
   - Sets up Go 1.21
   - Downloads dependencies
   - Builds Linux binary with CGO enabled (for SQLite)

3. **Deployment Process**:
   - Connects to Lightsail via SSH
   - Copies binary and schema to server
   - Stops existing service
   - Starts updated service
   - Verifies deployment with health check

## Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub → Actions → Deploy to Lightsail
2. Click "Run workflow"
3. Select branch (main)
4. Click "Run workflow"

## Monitoring

### View service status

```bash
ssh ubuntu@your-lightsail-ip
sudo systemctl status laserscribe
```

### View logs

```bash
sudo journalctl -u laserscribe -f
```

### Restart service manually

```bash
sudo systemctl restart laserscribe
```

## Troubleshooting

### Deployment fails with SSH error

- Verify `LIGHTSAIL_SSH_KEY` secret contains the complete private key
- Check that public key is in `~/.ssh/authorized_keys` on server
- Ensure SSH key has proper line breaks (use `cat ~/.ssh/id_ed25519` exactly)

### Service won't start

- Check logs: `sudo journalctl -u laserscribe -n 50`
- Verify environment file exists: `ls -la /opt/laserscribe/.env`
- Check binary permissions: `ls -la /opt/laserscribe/laserscribe-api`
- Test binary manually: `/opt/laserscribe/laserscribe-api`

### Database errors

- Ensure database file has correct permissions
- Check DB_PATH in .env file
- Initialize database: `cd /opt/laserscribe && ./laserscribe-api`

### Health check fails

- Verify port 8080 is not blocked
- Check if service is running: `sudo systemctl status laserscribe`
- Test health endpoint: `curl http://localhost:8080/api/health`

## Security Notes

- Keep SSH keys secure and never commit them to the repository
- Use GitHub Secrets for all sensitive data
- Restrict SSH access to specific IPs if possible
- Keep the server and dependencies updated
- Use HTTPS in production (set up nginx/caddy as reverse proxy)

## Production Considerations

For production deployments, consider:

1. **Reverse Proxy**: Use nginx or Caddy for HTTPS
2. **Database Backups**: Set up automated SQLite backups
3. **Monitoring**: Add health check monitoring (e.g., UptimeRobot)
4. **Log Rotation**: Configure logrotate for service logs
5. **Firewall**: Configure UFW to restrict access
6. **Zero-Downtime**: Implement blue-green deployment strategy
