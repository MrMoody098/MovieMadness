import './App.css';
import MoviesList from './components/MoviesList';
import NavBar from './components/NavBar.js';
import React from "react";
import MovieEmbed from "./components/MovieEmbed";

function App() {
  return (
    <div className="App">
      <header className="App-header">
      </header>
      <main>
        <MoviesList />
      </main>
    </div>
  );
}

export default App;
