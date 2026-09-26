# 🚀 Developmental DevOps Crash Course

Welcome to the Complete Developer-Focused DevOps Guide. This document captures the entire end-to-end DevOps lifecycle, from an empty folder to a fully automated, CI/CD-protected infrastructure. 

---

## 📑 Table of Contents
1. [Phase 1: Git & Workspace Initialization](#phase-1-git--workspace-initialization)
2. [Phase 2: The Core App & 12-Factor Configuration](#phase-2-the-core-app--12-factor-configuration)
3. [Phase 3: Containerization with Docker](#phase-3-containerization-with-docker)
4. [Phase 4: Orchestration with Docker Compose](#phase-4-orchestration-with-docker-compose)
5. [Phase 5: Continuous Integration (GitHub Actions)](#phase-5-continuous-integration-github-actions)
6. [Phase 6: The Professional PR Workflow & Branch Protection](#phase-6-the-professional-pr-workflow--branch-protection)

---

## Phase 1: Git & Workspace Initialization

**The Theory:**
In DevOps, **Git is the absolute source of truth**. Infrastructure, application code, and pipelines all live in version control. If it is not committed to Git, it does not exist. We isolate our projects using a `.gitignore` file to prevent committing bloated dependencies (`node_modules`) or sensitive secrets.

**The Implementation:**
```powershell
mkdir devops-course
cd devops-course
git init
```

> [!WARNING]
> **The PowerShell UTF-16 Trap**
> If you create a file using `echo "node_modules/" > .gitignore` in Windows PowerShell, it is saved in **UTF-16 encoding**. Git expects **UTF-8**. Because the encoding is wrong, Git ignores the file and stages your entire `node_modules` folder! 
> **The Fix:** Always create/save your `.gitignore` files via an editor like VS Code, which defaults to UTF-8.

---

## Phase 2: The Core App & 12-Factor Configuration

**The Theory:**
The "12-Factor App" methodology dictates that **configuration should be strictly separated from code**. Anything that changes between environments (ports, database URLs) must be passed via **Environment Variables**.

**The Implementation:**
First, initialize the Node project:
```powershell
npm init -y
```

> [!CAUTION]
> **PowerShell Execution Policy Error**
> If `npm` fails with *UnauthorizedAccess*, Windows is blocking PowerShell scripts. 
> **Fix:** Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

**index.js (Version 1):**
```javascript
const http = require("http");

// Read config from Environment Variables, with safe defaults
const port = process.env.PORT || 3000;
const message = process.env.MASSAGE || 'Hello from Anw Devops Server!';

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end(`${message}\n`);
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

**Testing Locally:**
```powershell
$env:PORT="5000"
$env:MASSAGE="Hello DevOps!"
node index.js
```

---

## Phase 3: Containerization with Docker

**The Theory:**
Docker solves the famous *"it works on my machine"* problem. A `Dockerfile` creates an isolated blueprint (an Image) that contains your app code *plus* the exact version of the OS and runtime required to run it identically everywhere.

**The Implementation:**
Create a file named `Dockerfile` (no extension):
```dockerfile
# Start from a lightweight Linux base image with Node pre-installed
FROM node:20-alpine

# Set our working directory inside the container
WORKDIR /app

# Copy our application files into the container
COPY package.json index.js ./

# Install dependencies (Needed for Phase 4)
RUN npm install

# Tell Docker the default command to start the app
CMD ["node", "index.js"]
```

**Building and Running:**
```powershell
docker build -t devops-server .
docker run -p 5000:3000 -e PORT=3000 -e MASSAGE="Hello Docker" devops-server
```

---

## Phase 4: Orchestration with Docker Compose

**The Theory:**
Modern apps require multiple services (Databases, Caches, APIs). **Docker Compose** allows you to define multi-container applications declaratively in a `.yml` file. It automatically creates a private DNS network so containers can talk to each other using names (like `cache`).

**The Implementation:**
Install Redis:
```powershell
npm install redis
```

**Updated `index.js` (Adding Redis):**
```javascript
const http = require("http");
const { createClient } = require("redis");

const port = process.env.PORT || 3000;
const massage = process.env.MASSAGE || 'Hello from Docker Compose!';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const client = createClient({ url: redisUrl });
client.on('error', (err) => console.log('Redis Error', err));

const server = http.createServer(async (req, res) => {
    if (!client.isReady) await client.connect();
    const hits = await client.incr('hits');
    
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end(`${massage}\nYou are visitor number: ${hits}\n`);
});

// CRITICAL: Bind to 0.0.0.0 in Docker!
server.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
```

**docker-compose.yml:**
```yaml
services:
  cache:
    image: redis:alpine
    ports:
      - "6379:6379"

  web:
    build: .
    ports:
      - "5000:3000"
    environment:
      - PORT=3000
      - MASSAGE="Hello from Docker Compose!"
      - REDIS_URL=redis://cache:6379
    depends_on:
      - cache
```

**Starting the Stack:**
```powershell
docker compose up -d --build
```

> [!TIP]
> **DevOps Troubleshooting Traps**
> 1. **"Port is already allocated"**: Caused by a "Zombie" container left running in the background holding port 5000. 
>    *Fix:* `docker ps` to find it, then `docker rm -f <ID>`.
> 2. **"ERR_CONNECTION_REFUSED" on a running container**: Inside Docker, Node.js must explicitly bind to `0.0.0.0` to accept outside traffic. If it binds to `localhost`, it only listens to itself!

---

## Phase 5: Continuous Integration (GitHub Actions)

**The Theory:**
To prevent developers from accidentally breaking code, **Continuous Integration (CI)** automatically downloads your code and runs tests on a remote server every time you push or open a Pull Request.

**The Implementation:**
Create `.github/workflows/ci.yml`:
```yaml
name: DevOps CI Pipeline

on:
  push:
    branches: [ "master", "main" ]
  pull_request:
    branches: [ "master", "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Run syntax check
        run: node --check index.js
```
Authenticate with `gh auth login` and push the code to trigger the green checkmarks in the cloud!

---

## Phase 6: The Professional PR Workflow & Branch Protection

**The Theory:**
In enterprise environments, no one pushes directly to `main`. You create a feature branch, commit changes, push, and open a Pull Request (PR).

> [!NOTE]
> If you create a branch but don't save any new changes before committing, your branch remains an exact clone of `main`. GitHub won't let you create a PR because there are zero diffs to merge!

**Professional PR Best Practices:**
1. **Strong Titles:** Use Conventional Commits (`feat: update welcome message`).
2. **Explain the "Why":** The code shows *what* changed. Your PR description explains *why*.
3. **Self-Review:** Always read your own "Files changed" tab before requesting reviewers.
4. **Keep it Small:** Small PRs get reviewed faster and have fewer bugs.
5. **Squash and Merge:** Keeps the `main` branch Git history clean.

### Enforcing Rules (Branch Rulesets)
To ensure no one bypasses this workflow, configure a GitHub Branch Ruleset on `main`:
- ✅ **Require a pull request before merging** (Forces the PR workflow)
- ✅ **Require status checks to pass** (Forces your GitHub Actions CI to pass before merging)
- ✅ **Block force pushes** (Prevents history rewriting)
- ✅ **Restrict deletions** (Protects the main branch from deletion)
