import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/structure/Footer";
import Header from "./components/structure/Header";
import DatasetSummaryPage from "./pages/DatasetSummaryPage";
import InputPage from "./pages/InputPage";
import ResultsPage from "./pages/ResultsPage";
import HomePage from "./pages/HomePage";

class App extends React.Component {

  render() {
    return (
        <BrowserRouter>
          <Header />
          <main className="app-main">
            <div className="app-content">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="results/summary" element={<DatasetSummaryPage />} />
                <Route path="input" element={<InputPage />} />
              </Routes>
            </div>
          </main>
          <Footer />
        </BrowserRouter>
    );
  }
}

export default App;
