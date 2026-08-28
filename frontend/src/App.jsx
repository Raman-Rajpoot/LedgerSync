import "./App.css";

import Navbar from "./features/logic/sidebar";
import Navigation from "./navigation.jsx";

import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  /*
    Pages where Sidebar should NOT appear
  */

  const publicPages = [
    "/",
    "/login",
    "/register",
  ];

  const isPublicPage = publicPages.includes(location.pathname);

  return (
    <div className="App">

      {isPublicPage ? (

        /*
          Login / Register pages
        */

        <Navigation />

      ) : (

        /*
          Main LedgerSync application
        */

        <div className="app-layout">

          <Navbar />

          <main className="main-content">

            <Navigation />

          </main>

        </div>

      )}

    </div>
  );
}

export default App;