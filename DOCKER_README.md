# 🐳 MovieMadness - Docker Setup

Running MovieMadness with Docker is simple! Docker packages everything you need into a container.

---

## 🎯 Why Use Docker?

- ✅ No need to install Node.js or other dependencies
- ✅ Works the same on any computer
- ✅ Easy to deploy to servers
- ✅ Cleaner than installing stuff on your computer

---

## 📋 What You Need

1. **Docker Desktop** - Download from https://www.docker.com/products/docker-desktop
   - Install it with default settings
   - Open Docker Desktop and make sure it's running

That's it! Docker includes everything else.

---

## 🚀 Running the App with Docker

### Option 1: Double-Click to Run (Easiest!)

**For Development (with code changes):**
1. Double-click `start-dev.bat`
2. Wait for it to build (first time takes 2-3 minutes)
3. Open http://localhost:3000

**For Production (optimized):**
1. Double-click `start-prod.bat`
2. Wait for it to build
3. Open http://localhost

### Option 2: Using Commands

**Development Mode:**
```bash
docker-compose up --build
```
Open http://localhost:3000

**Production Mode:**
```bash
docker-compose -f docker-compose.prod.yml up --build
```
Open http://localhost

---

## 🛑 How to Stop the App

### If you used the .bat files:
- Press **Ctrl + C** in the window
- Or just close the window

### If you used commands:
- Press **Ctrl + C** in the terminal
- Then run: `docker-compose down`

---

## 🔄 Development vs Production Mode

### Development Mode 🛠️
- **Port:** http://localhost:3000
- **Features:**
  - Code changes update automatically
  - Easier to debug
  - Larger file size (~1.2 GB)
- **Use for:** Local development

### Production Mode 🚀
- **Port:** http://localhost
- **Features:**
  - Optimized and fast
  - Smaller file size (~50 MB)
  - Uses Nginx server
  - Better performance
- **Use for:** Deploying to servers

---

## 📝 Useful Commands

### See What's Running
```bash
docker ps
```

### View Logs (Development)
```bash
docker-compose logs -f
```

### View Logs (Production)
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Stop Everything
```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down
```

### Remove Everything and Start Fresh
```bash
# Stop containers
docker-compose down

# Remove the image
docker rmi movie-madness-dev

# Rebuild
docker-compose up --build
```

---

## 🆘 Troubleshooting

### Docker Desktop Won't Start
1. Make sure virtualization is enabled in your BIOS
2. Restart your computer
3. Open Docker Desktop again

### Port Already in Use
If port 3000 or 80 is taken:

1. Stop the app using that port
2. Or change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Use 3001 instead
   ```

### Container Won't Build
1. Make sure Docker Desktop is running
2. Check the logs: `docker-compose logs`
3. Try cleaning up:
   ```bash
   docker-compose down -v
   docker system prune -f
   docker-compose up --build
   ```

### "Cannot connect to Docker daemon"
→ Docker Desktop isn't running. Open Docker Desktop first!

### Changes Not Showing (Development Mode)
→ Make sure you're using Development mode (`start-dev.bat` or `docker-compose.yml`)

---

## 📂 What's in Each File?

- **Dockerfile** - Development setup
- **Dockerfile.prod** - Production setup (smaller, faster)
- **docker-compose.yml** - Development configuration
- **docker-compose.prod.yml** - Production configuration
- **start-dev.bat** - Click to run in development mode
- **start-prod.bat** - Click to run in production mode
- **.dockerignore** - Files to exclude from Docker

---

## 🎓 Understanding the Setup

### Development Mode
- Uses `Dockerfile` and `docker-compose.yml`
- Mounts your code as volumes (changes sync automatically)
- Runs `npm start` inside the container
- Perfect for coding

### Production Mode
- Uses `Dockerfile.prod` and `docker-compose.prod.yml`
- Builds your app with `npm run build`
- Serves files with Nginx (super fast!)
- Perfect for deploying

---

## 🔧 Advanced: Running Without .bat Files

If you're on Mac/Linux or prefer the terminal:

### Development
```bash
docker-compose up --build
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

The `-d` flag runs it in the background.

---

## 🌐 Deploying to a Server

1. **Copy these files to your server:**
   - `Dockerfile.prod`
   - `docker-compose.prod.yml`
   - `nginx.conf`
   - The entire `movie-man-view/` folder

2. **On the server, run:**
   ```bash
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

3. **Your app is live!** 🎉

---

## 💡 Tips

1. **First Build is Slow** - Docker downloads everything. Next time is faster!
2. **Use Dev Mode for Coding** - Changes update automatically
3. **Use Prod Mode for Deployment** - Much smaller and faster
4. **Keep Docker Desktop Running** - Required for Docker to work
5. **Clean Up Regularly** - Run `docker system prune` to free space

---

## ❓ Still Confused?

**Want to run without Docker?** → See [README.md](README.md)

**Need more help?** → Open an issue on GitHub

---

**Happy Dockering! 🐳**
