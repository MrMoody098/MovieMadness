# 🎬 MovieMadness

A React app to browse trending movies and TV shows with trailers from The Movie Database (TMDb).

![MovieMadness Screenshot](https://github.com/user-attachments/assets/47512291-1a96-4c52-bad3-2b108b36f119)

---

## 🚀 Quick Start (Running in Cursor or Your Computer)

### Step 1: Open the Project in Cursor

1. Open **Cursor** (download from https://cursor.sh if you don't have it)
2. Click **File** → **Open Folder**
3. Select the **MovieMadness** folder
4. Cursor will open the project

### Step 2: Open the Terminal

1. In Cursor, click **Terminal** at the top menu
2. Select **New Terminal**
3. A terminal window will appear at the bottom

### Step 3: Install Dependencies

In the terminal, type these commands one at a time and press Enter:

```bash
cd movie-man-view
npm install
```

Wait for it to finish (you'll see lots of text, that's normal!)

### Step 4: Start the App

In the same terminal, type:

```bash
npm start
```

### Step 5: Open in Your Browser

The app will automatically open in your browser at:
**http://localhost:3000**

If it doesn't open automatically, just copy that address into your browser.

**🎉 That's it! The app is running!**

---

## 🛑 How to Stop the App

In the terminal where it's running:
- Press **Ctrl + C** (hold Ctrl and press C)
- The app will stop

---

## ⚙️ What You Need Installed

Before starting, make sure you have:

1. **Node.js** - Download from https://nodejs.org (get the LTS version)
2. **Cursor** - Download from https://cursor.sh (or use VS Code)

That's all you need!

---

## 🔑 Getting a Movie Database API Key (Optional)

The app uses the TMDb API to get movie data. To get your own API key:

1. Go to https://www.themoviedb.org/
2. Click **Sign Up** and create a free account
3. Go to **Settings** → **API** → **Request API Key**
4. Choose **Developer** and fill out the form
5. You'll get an API key

To use it in the app:
1. Open the file where the API key is used (usually in `src` folder)
2. Replace the existing API key with yours

---

## 📁 Project Structure

```
MovieMadness/
  ├── movie-man-view/          ← Main app folder
  │   ├── src/                 ← Source code
  │   │   ├── components/      ← UI components
  │   │   ├── App.js          ← Main app file
  │   │   └── index.js        ← Entry point
  │   ├── public/             ← Static files
  │   └── package.json        ← Dependencies
  └── README.md               ← This file!
```

---

## 🆘 Troubleshooting

### "npm: command not found" or "node: command not found"
→ You need to install Node.js from https://nodejs.org

### Port 3000 is already in use
→ Another app is using port 3000. Stop that app or the terminal will suggest a different port

### Changes aren't showing up
→ Make sure the terminal is still running `npm start`. If you made code changes, save the file and it will automatically refresh

### Nothing happens when I type `npm start`
→ Make sure you're in the correct folder. Type `cd movie-man-view` first

---

## 🐳 Want to Use Docker Instead?

If you want to run this app in a Docker container, see [DOCKER_README.md](DOCKER_README.md)

Docker is great for deployment but not necessary for local development.

---

## 🎯 Features

- ✅ Browse trending movies and TV shows
- ✅ Search for movies by title
- ✅ Watch trailers
- ✅ View movie details, ratings, and descriptions
- ✅ Modern, responsive design

---

## 🤝 Contributing

Want to improve this app?

1. Make your changes
2. Test them by running `npm start`
3. Submit a pull request on GitHub

---

## 📝 License

Open source - feel free to use and modify!

---

## 🙏 Credits

- **TMDb API** - Movie data and images
- **React** - Frontend framework

---

**Need help? Open an issue on GitHub!**
