import {
  PropsWithChildren,
  createContext,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
export const socket = io(import.meta.env.VITE_SERVER_URL as string, {
  transports: ["websocket"],
});
export type authData = {
  loggedIn: boolean;
  email?: string;
  displayName?: string;
  picture?: string;
};

type socketStateType = {
  registered: boolean;
  requestedImage: boolean;
};

type contextType = {
  authData: authData;
  setAuthData: React.Dispatch<React.SetStateAction<authData>>;
  socketConnected: boolean;
  setSocketConnected: React.Dispatch<React.SetStateAction<boolean>>;
  image: string;
  setImage: React.Dispatch<React.SetStateAction<string>>;
  socketStateRef: React.MutableRefObject<socketStateType> | null;
  backendDataLoading: boolean;
  setBackendDataLoading: React.Dispatch<React.SetStateAction<boolean>>;
  showLoader: boolean;
  setShowLoader: React.Dispatch<React.SetStateAction<boolean>>;
};

const initialData = {
  authData: {
    loggedIn: false,
  },
  setAuthData: () => {},
  socketConnected: false,
  setSocketConnected: () => {},
  image: "",
  setImage: () => {},
  socketStateRef: null,
  backendDataLoading: false,
  setBackendDataLoading: () => {},
  showLoader: false,
  setShowLoader: () => {},
};

export const mainContext = createContext(initialData as contextType);


function MainContext({ children }: PropsWithChildren) {
  const [authData, setAuthData] = useState<authData>(initialData.authData);

  const [socketConnected, setSocketConnected] = useState(
    initialData.socketConnected
  );
  const [image, setImage] = useState(initialData.image);
  const socketStateRef = useRef({
    registered: false,
    requestedImage: false,
  });
  const [backendDataLoading, setBackendDataLoading] = useState(
    initialData.backendDataLoading
  );
  const [showLoader, setShowLoader] = useState(false);
  const obj = {
    authData,
    setAuthData,
    socketConnected,
    setSocketConnected,
    image,
    setImage,
    socketStateRef,
    backendDataLoading,
    setBackendDataLoading,
    showLoader,
    setShowLoader,
  };

  return <mainContext.Provider value={obj}>{children}</mainContext.Provider>;
}

export default MainContext;
