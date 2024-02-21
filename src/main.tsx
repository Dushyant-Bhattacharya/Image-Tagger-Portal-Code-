import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import MainContext from "./Context/MainContext.tsx";
import { ErrorBoundary } from "react-error-boundary";import FallbackComp from "./Components/ErrorBoundary/FallbackComp.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
//<React.StrictMode>
    <ErrorBoundary FallbackComponent={FallbackComp}>
    <MainContext>
      <App />
    </MainContext>
    </ErrorBoundary>
  //</React.StrictMode>
);
