import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { mainContext, socket } from "../Context/MainContext";
import { Popover, notification } from "antd";
import { AnimatePresence } from "framer-motion";
type activeUserType = { image: string; email: string };
type activeUsersType = {
  count: number;
  users?: activeUserType[];
};
function Navbar() {
  const { authData, setShowLoader, setImage } = useContext(mainContext);
  const [activeUsers, setActiveUsers] = useState<activeUsersType>({
    count: 0,
  });
  const [untaggedImageCount, setUntaggedImageCount] = useState("");
  const [api, context] = notification.useNotification();
  const [hasMouse, setHasMouse] = useState(false);
  const errorReceived = useRef(false);
  const authEmail = useRef("");
  const receivedPendingComplete = useRef(false);

  const mouseMoveCallback = useCallback(() => {
    setHasMouse(true);
  }, []);
  useEffect(() => {
    // if the user device contains mouse, then active user popup will open on hover , else it will open on click for mobile devices
    window.addEventListener("mousemove", mouseMoveCallback);
    return () => {
      window.removeEventListener("mousemove", mouseMoveCallback);
    };
  }, []);
  useEffect(() => {
    if (authData.loggedIn == true) {
      authEmail.current = authData.email as string;
    }
  }, [authData]);
  //getting data for all the active users
  socket.on("activeUsers", (data: activeUsersType) => {
    setActiveUsers(data);
  });
  // removing current users instance from the queue on the server, so the associated image can be assigned to other users.
  socket.on("logoutConfirm", async () => {
    let request = await fetch("/api/logout");
    await request.json();
    window.open("/api/auth/google", "_self");
  });
  // this will trigger if one of the users has not tagged the image and they are having the last data.
  socket.on("pendingCompletion", () => {
    if (receivedPendingComplete.current == false) {
      receivedPendingComplete.current = true;
      api.error({
        duration: 10,
        message: "Error",
        description:
          "One or More users have not yet tagged the images, either you can wait for them to complete or reset all the images with no values",
        btn: (
          <button
            className="bg-red-500 px-2 p-1 rounded-lg shadow-sm shadow-neutral-500 text-white font-semibold active:bg-red-600 hover:shadow-md hover:shadow-neutral-500
                  active:shadow-sm active:shadow-neutral-600 transition-all duration-150"
            onClick={() => {
              debugger;
              socket.emit("resetData", {
                email: authEmail.current,
              });
            }}
          >
            Reset Data
          </button>
        ),
      });
    }
    setTimeout(() => {
      receivedPendingComplete.current = false;
    }, 3000);
  });

  // this will trigger when multiple users with same email try to login to the application , in order to maintain a single user instance per email.
  socket.on("multipleUsers", () => {
    debugger
    if (errorReceived.current == false) {
      errorReceived.current = true;
      setImage("");
      setShowLoader(true);
      api.error({
        duration: null,
        message: "Error",
        description:
          "Multiple users with same email detected, please logout out of other browsers / instances or log out from this account by clicking on the your account icon , or else you won't be allowed to tag the images.",
        btn: (
          <button
            className="bg-red-500 px-2 p-1 rounded-lg shadow-sm shadow-neutral-500 text-white font-semibold active:bg-red-600 hover:shadow-md hover:shadow-neutral-500
            active:shadow-sm active:shadow-neutral-600 transition-all duration-150"
            onClick={() => {
              debugger;
              // this will remove the user instance and emit a logout event for the other associated sockets for the same email from server.
              socket.emit("logoutEveryWhereClient", {
                email: authEmail.current,
              });
            }}
          >
            Logout Everywhere
          </button>
        ),
      });

      setTimeout(() => {
        errorReceived.current = false;
      }, 3000);
      // to avoid over population of messages received on the fronend.
    }
  });
  // this provides the total no. of untagged images currently
  socket.on("counter", (data: { count: number }) => {
    setUntaggedImageCount("");
    setTimeout(() => {
      setUntaggedImageCount(data.count.toString());
    }, 500);
  });
  return (
    <div>
      {context}
      {authData != null && (
        <div className="flex flex-row px-4 py-2 w-full relative justify-between items-center overflow-hidden">
          {activeUsers.count > 0 && (
            <Popover
              trigger={hasMouse == true ? "hover" : "click"}
              placement="right"
              arrow={false}
              content={() => (
                <div className="flex flex-col w-[10rem] sm:w-full p-2 gap-2 max-h-[10rem] overflow-auto styledScrollbar text-sm sm:text-base">
                  {activeUsers.count > 0 &&
                    activeUsers.users?.map((row: activeUserType) => (
                      <div className="flex flex-row px-2 gap-2 items-center">
                        <img
                          src={row.image}
                          className="w-8 h-8 rounded-full"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                        <h3>{row.email}</h3>
                      </div>
                    ))}
                </div>
              )}
            >
              <div className="font-semibold tracking-tight text-lg border border-neutral-400 flex flex-row gap-2 w-10 h-10 shadow-sm shadow-neutral-500 text-orange-500 rounded-full">
                <h3 className="mx-auto my-auto">{activeUsers.count}</h3>
              </div>
            </Popover>
          )}
          <div className="flex flex-row gap-2  font-semibold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent items-center text-sm sm:text-lg ">
            <h3>Untagged Count</h3>
            <h3>-</h3>
            <div className="w-1">
              <AnimatePresence>
                {untaggedImageCount != "" && (
                  <motion.h3
                    initial={{
                      translateY: 20,
                      opacity: 0,
                    }}
                    animate={{
                      translateY: [-20, 0],
                      opacity: 1,
                    }}
                    exit={{
                      translateY: 20,
                      opacity: 0,
                    }}
                    transition={{
                      type: "just",
                    }}
                    className=" text-orange-500 "
                  >
                    {untaggedImageCount}
                  </motion.h3>
                )}
              </AnimatePresence>
            </div>
          </div>
          <button
            className="w-fit  shadow-md rounded-full shadow-neutral-600 hover:shadow-lg hover:shadow-neutral-700 active:shadow-neutral-800 active:shadow-sm transition-all duration-150"
            onClick={() => {
              //this will logout the current user instance.
              socket.emit("logoutUser", { email: authData.email });
            }}
          >
            <img
              className="w-10 h-10 rounded-full"
              src={authData.picture}
              alt=""
              referrerPolicy="no-referrer"
            />
          </button>
        </div>
      )}
    </div>
  );
}

export default Navbar;
