import Footer from "../Components/Layout/Footer/Footer";
import Navbar from "../Components/Layout/Navbar/Navbar";
import MapView from "./MapView";

const ExploreMap = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Navbar/>
      <MapView fullHeight />
      <Footer/>
    </div>
  );
};

export default ExploreMap;
