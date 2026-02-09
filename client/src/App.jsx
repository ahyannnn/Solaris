import { useEffect } from "react";
import { api } from "./services/api";
import SolarisLandingPage from './components/landingpage';

function App() {
  useEffect(() => {
    api.get("/")
      .then(res => console.log(res.data))
      .catch(err => console.error(err));
  }, []);

  return <SolarisLandingPage />;
}

export default App;