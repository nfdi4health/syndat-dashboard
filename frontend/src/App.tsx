import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Footer from "./components/structure/Footer";
import Header from "./components/structure/Header";
import DatasetSummaryPage from "./pages/DatasetSummaryPage";
import InputPage from "./pages/InputPage";
import ResultsPage from "./pages/ResultsPage";

class App extends React.Component {

  render() {
    return (
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<InputPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="results/summary" element={<DatasetSummaryPage />} />
            <Route path="input" element={<InputPage />} />
          </Routes>
          <Footer />
        </BrowserRouter>
    );
  }
}

export default App;
