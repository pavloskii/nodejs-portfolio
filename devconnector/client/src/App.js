import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Landing from "./components/layout/Landing";
import "./App.css";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Navbar />
          <Route path="/" component={Landing} exact />
          <div className="container">
            <Route path="/register" component={Register} exact />
            <Route path="/login" component={Login} exact />
          </div>
          <Footer />
        </div>
      </Router>
    );
  }
}

export default App;
