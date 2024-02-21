import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { jwtDecode } from "jwt-decode";
import "./App.css";
import { authData, mainContext, socket } from "./Context/MainContext";
import Navbar from "./Components/Navbar";
import Content from "./Components/Content";
// tried code splitting , but in Microsoft Edge some rendering issue is happening , but in chrome it was working fine.
// without code splitting it is working fine on all browser
function App() {
  const {
    authData,
    setAuthData,
    setSocketConnected,
    socketConnected,
    image,
    setImage,
    socketStateRef,
    setBackendDataLoading,
  } = useContext(mainContext);
  const authEmail = useRef("");
  useEffect(() => {
    if (authData.loggedIn == true) {
      authEmail.current = authData.email as string;
    }
  }, [authData]);
  // socket connection event
  socket.on("connected", () => {
    setSocketConnected(true);
  });

  const windowCloseCallback = useCallback(() => {
    // removing user instance from server, to prevent multipleUsers event from triggering
    socket.emit("userDisconnected", {
      email: authEmail.current,
    });
    window.removeEventListener("unload", windowCloseCallback);
  }, []);
  useEffect(() => {
    window.addEventListener("unload", windowCloseCallback);
  }, []);
  useEffect(() => {
    // authentication based code
    if (authData.loggedIn == false) {
      (async () => {
        debugger;
        let request = (await fetch(`/api/validateToken`, {
          method: "GET",
        }).catch(() => {
          debugger;
          window.open("/api/auth/google", "_self");
        })) as Response;

        let response = await request.json();
        if (response.valid == false) {
          window.open("/api/auth/google", "_self");
        } else {
          // login success
          let data = jwtDecode(response.token) as authData;
          socket.emit("registerUser", {
            username: data.displayName,
            email: data.email,
            instances: 1,
            image: data.picture,
          });
          setAuthData({
            ...data,
            loggedIn: true,
          });
        }
      })();
    }

    if (
      authData.loggedIn == true &&
      socketConnected == true &&
      socketStateRef != null
    ) {
      if (socketStateRef.current.registered == false) {
        socket.emit("registerUser", {
          username: authData.displayName,
          email: authData.email,
        });
        socketStateRef.current.registered = true;
      }
    }
  }, [authData]);
  // startTagging event is signal for the client to now start asking for untagged images
  socket.on("startTagging", () => {
    if (
      socketStateRef != null &&
      socketStateRef.current.requestedImage == false
    ) {
      if (image == "") {
        socket.emit("provideImage", {
          email: authEmail.current,
        });
      }
      socketStateRef.current.requestedImage = true;
      setTimeout(() => {
        socketStateRef.current.requestedImage = false;
      }, 3000);
      // using requestedImage flag to avoid over trigger of this event due to rerendering
    }
  });
  // this will logout the user from all the devices in which they are currenly loggedin with same email, this ensures only 1 user instance per email is maintained
  socket.on("logoutEveryWhereServer", async () => {
    debugger;
    let request = await fetch("/api/logout");
    await request.json();
    window.open("/api/auth/google", "_self");
  });
  // event for getting loading state of backend
  socket.on("loadingData", () => {
    setBackendDataLoading(true);
  });
  socket.on("loadingComplete", () => {
    setBackendDataLoading(false);
    if (image == "" && authEmail.current !== "") {
      socket.emit("provideImage", {
        email: authEmail.current,
      });
    }
  });
  // for resetting the tags
  socket.on("dataResetComplete", () => {
    setImage("");
    socket.emit("provideImage", {
      email: authEmail.current,
    });
  });
  return (
    <div className="h-screen bg-gradient-to-t from-cyan-300 to-zinc-100">
      
        <Navbar />
        <Content />
      
    </div>
  );
}

export default React.memo(App);
