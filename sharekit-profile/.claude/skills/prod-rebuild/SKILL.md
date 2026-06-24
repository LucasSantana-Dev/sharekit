---
name: prod-rebuild
description: Rebuild and restart production Docker services on remote server with async monitoring
user-invocable: true
argument-hint: "[services] [--no-cache]"
metadata:
  owner: lucas-dev
  tier: production
---

Rebuild and restart production Docker services on a remote server via SSH without blocking the session.

## Target environment

- **SSH host alias**: `server-do-luk`
- **Project path**: `/home/luk-server/Lucky`
- **Default services**: `bot backend frontend` (if not specified)
- **Log location**: `/tmp/lucky-build-<sha>.log`

## Workflow

1. **SSH connect**: Establish connection to `server-do-luk`
2. **Git pull**: `cd /home/luk-server/Lucky && git pull origin main`
3. **Background build**: Fire off `docker compose build [--no-cache] [services]` in the background
   - Capture PID and start background monitoring
   - Log output to `/tmp/lucky-build-<git-sha>.log`
4. **Build completes**: After the build process finishes:
   - Stop and remove existing containers: `docker rm -f <service>` for each service
   - Start fresh: `docker compose up -d <service>`
5. **Verify**: For each restarted service, run `docker exec <service> cat /app/package.json | grep version`
   - Extract version and confirm it matches the current main branch version
6. **Report**: Return final status: "Restart complete. Bot version: vX.Y.Z, Backend: vX.Y.Z, Frontend: vX.Y.Z"
7. **Non-blocking**: The SSH session returns immediately after triggering the build; monitoring continues asynchronously

## Safety rules

- **Never silently fail**: If `docker build` fails, halt monitoring and report stderr to the user immediately
- **Version verification**: Always verify service versions after restart; fail if version doesn't match
- **Log location**: Store build logs at `/tmp/lucky-build-<sha>.log` for debugging
- **Service restart order**: Build all first, then restart in dependency order (if applicable)

## Usage examples

```bash
# Rebuild default services (bot, backend, frontend)
/prod-rebuild

# Rebuild specific service without cache
/prod-rebuild backend --no-cache

# Rebuild multiple services
/prod-rebuild bot backend --no-cache
```

## Output / Evidence

- Confirm git pull on remote succeeded with latest commit SHA
- Confirm background build started with PID and log path
- After completion: Version table with each service and confirmed version
- Final status: "Restart complete. Bot version: vX.Y.Z"

## Implementation hints

- Use SSH `ProxyCommand` or direct connection to `server-do-luk`
- Fire off background process with `nohup ... &` to prevent session blocking
- Monitor `/tmp/lucky-build-<sha>.log` using `tail -f` in a background loop
- Use `docker inspect --format='{{.State.Running}}'` to poll container status
- Exit SSH session early; let background loop continue
- On failure, extract last 50 lines of log and return to user
