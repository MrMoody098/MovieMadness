# 🚀 Quick Start Guide - MovieMadness

## Method 1: Run with npm (Recommended for Development)

### Prerequisites
- **Node.js** installed (download from https://nodejs.org - get the LTS version)
- **npm** (comes with Node.js)

### Steps:

1. **Open Terminal/Command Prompt**
   - In Cursor: Click **Terminal** → **New Terminal**
   - Or open PowerShell/Command Prompt in the project folder

2. **Navigate to the React app folder:**
   ```bash
   cd movie-man-view
   ```

3. **Install dependencies** (first time only):
   ```bash
   npm install
   ```
   This may take a few minutes. Wait for it to complete.

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   - The app will automatically open at **http://localhost:3000**
   - If it doesn't, manually navigate to that address

6. **To stop the app:**
   - Press `Ctrl + C` in the terminal

---

## Method 2: Run with Docker (Alternative)

### Prerequisites
- **Docker Desktop** installed (download from https://www.docker.com/products/docker-desktop)

### Steps:

1. **For Development Mode:**
   - Double-click `start-dev.bat` (Windows)
   - Or run: `docker-compose up --build`
   - App runs at: **http://localhost:3000**

2. **For Production Mode:**
   - Double-click `start-prod.bat` (Windows)
   - Or run: `docker-compose -f docker-compose.prod.yml up --build -d`
   - App runs at: **http://localhost**

---

## 🎯 What to Expect

Once running, you should see:
- Movie browsing interface
- Search functionality
- Movie/TV show details
- **Torrent download feature** (click "📥 Download Torrent" button on any movie/show)

---

## 🐛 Troubleshooting

### "npm: command not found"
→ Install Node.js from https://nodejs.org

### "Port 3000 is already in use"
→ Another app is using port 3000. The terminal will suggest a different port (like 3001)

### "Cannot find module" errors
→ Run `npm install` again in the `movie-man-view` folder

### WebTorrent not working
→ Make sure you're using a modern browser (Chrome, Firefox, Edge)
→ Some browsers may require HTTPS for WebTorrent to work properly

---

## 📝 Notes

- The app uses **WebTorrent** for torrent downloads in the browser
- Torrent searches use multiple APIs with fallback options
- First-time torrent downloads may take a moment to connect to peers
- Video playback works once torrents are downloaded

---

**Enjoy! 🎬**

