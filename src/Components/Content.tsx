import { useContext, useEffect, useRef, useState } from "react";
import { mainContext, socket } from "../Context/MainContext";
import { AnimatePresence, motion } from "framer-motion";
import TextArea from "antd/es/input/TextArea";
type receivedDataType = {
  image: string;
  tag: string;
  assigned: boolean;
  assignedTo: boolean;
  _id: string;
} | null;

type receiveDataPayload = {
  data: receivedDataType;
};
function Content() {
  const {
    image,
    setImage,
    authData,
    backendDataLoading,
    showLoader,
    setShowLoader,
  } = useContext(mainContext);

  const [showImage, setShowImage] = useState(false);
  const imagePayload = useRef<receivedDataType>(null);
  const [tag, setTag] = useState("");
  const showLoaderRef = useRef(false);
  const loaderInterval = useRef<null | number>(null);
  const [taggingComplete, setTaggingComplete] = useState(false);
  // for showing / hiding the loading card
  function loaderIntervalFunction(force?: boolean) {
    debugger;
    if (
      (loaderInterval.current == null && image == "") ||
      (force != undefined && force == true)
    ) {
      loaderInterval.current = setInterval(() => {
        debugger;
        showLoaderRef.current = !showLoaderRef.current;
        setShowLoader(showLoaderRef.current);
      }, 1000);
    } else {
      clearInterval(loaderInterval.current as number);
      loaderInterval.current = null;
      setShowLoader(false);
      showLoaderRef.current = false;
    }
  }
  useEffect(() => {
    loaderIntervalFunction();
    return () => {
      clearInterval(loaderInterval.current as number);
      loaderInterval.current = null;
      setShowLoader(false);
      showLoaderRef.current = false;
    };
  }, []);
  // receiveData proivdes the user with latest assigned image
  socket.on("receiveData", (data: receiveDataPayload) => {
    setImage(data.data!.image);
    imagePayload.current = data.data;
    if (loaderInterval.current != null) {
      clearInterval(loaderInterval.current as number);
      loaderInterval.current = null;
    }
    setTaggingComplete(false);
    setShowLoader(false);
    showLoaderRef.current = false;
    setTimeout(() => {
      setShowImage(true);
    }, 200);
  });
  // this triggers when length of ImageQueue and Untagged image count in database is 0 , and this triggers a complete card to show up
  socket.on("taggingCompletedForAllImages", () => {
    if (image == "") {
      setTaggingComplete(true);
    }
  });
  return (
    <div className="w-11/12 sm1:w-8/12 sm:w-10/12 sm2:w-6/12 md:w-7/12 md1:w-8/12 lg:w-5/12 xl:w-5/12 2xl:w-3/12 h-[80vh] p-5 mx-auto  flex flex-col items-center justify-center  my-auto">
      <AnimatePresence>
        {(showLoader == true || (image == "" && backendDataLoading == true)) &&
          taggingComplete == false && (
            <motion.div
              className="flex flex-col bg-gradient-to-t from-slate-100 to-cyan-300 w-full h-[80%] 
            items-center justify-center rounded-2xl shadow-md shadow-neutral-400 "
              initial={{
                opacity: 0,
                translateY: 20,
              }}
              animate={{
                opacity: 1,
                translateY: [-70, 0],
              }}
              exit={{
                opacity: 0,
                translateY: 100,
                transition: {
                  type: "just",
                },
              }}
              transition={{
                type: "spring",
                bounce: 0.7,
                bounceStiffness: 50,
              }}
            >
              <h3 className="text-lg font-semibold">Loading ...</h3>
            </motion.div>
          )}
        {showImage == true && image != "" && taggingComplete == false && (
          <motion.div
            className="flex flex-col bg-white w-full h-[80%] 
            items-center  rounded-2xl shadow-md gap-1 shadow-neutral-400 overflow-hidden p-2"
            initial={{
              opacity: 0,
              translateY: 20,
            }}
            animate={{
              opacity: 1,
              translateY: [-70, 0],
            }}
            exit={{
              opacity: 0,
              translateY: 100,
              transition: {
                type: "just",
              },
            }}
            transition={{
              type: "spring",
              bounce: 0.7,
              bounceStiffness: 50,
            }}
          >
            <img src={image} className="w-full h-[80%] rounded-md  " alt="" />
            <div className="relative w-full">
              <AnimatePresence>
                {tag.length > 0 && (
                  <motion.button
                    initial={{
                      scale: 0,
                      opacity: 0,
                      translateY: -40,
                    }}
                    animate={{
                      scale: [1.5, 1],
                      opacity: 1,
                      translateY: 0,
                    }}
                    exit={{
                      scale: 0,
                      opacity: 0,

                      transition: {
                        duration: 0.3,
                        bounceStiffness: 80,
                      },
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.7,
                      bounceStiffness: 50,
                    }}
                    className={`absolute bg-blue-600 z-10 -right-2 -top-8 w-14 h-14 rounded-full shadow-md shadow-neutral-500 hover:bg-blue-700 hover:shadow-lg hover:shadow-neutral-600 active:bg-blue-700 active:shadow-sm active:shadow-neutral-700 
                    `}
                    onClick={() => {
                      setShowImage(false);
                      setImage("");
                      setShowLoader(false);
                      setTaggingComplete(false);
                      showLoaderRef.current = false;
                      socket.emit("imageTagged", {
                        tag: tag,
                        email: authData.email,
                        _id: imagePayload.current?._id,
                      });
                      setTimeout(() => {
                        socket.emit("provideImage", {
                          email: authData.email,
                        });
                      }, 300);
                      setTimeout(() => {
                        loaderIntervalFunction(true);
                      }, 300);
                      setTag("");
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 24"
                      strokeWidth={1.4}
                      stroke="currentColor"
                      className="w-8 h-8 text-white mx-auto"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                      />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <TextArea
              value={tag}
              rows={5}
              autoSize={false}
              onChange={(e) => {
                setTag(e.target.value);
              }}
              style={{
                resize: "none",
              }}
              className="styledScrollbar font-semibold"
              placeholder="If image is unclear , please type - 'Other'"
            />
          </motion.div>
        )}
        {taggingComplete == true && (
          <motion.div
            className="flex flex-col bg-gradient-to-t from-slate-100 to-cyan-300 w-full h-[80%] 
            items-center justify-center rounded-2xl shadow-md shadow-neutral-400 gap-2"
            initial={{
              opacity: 0,
              translateY: 20,
            }}
            animate={{
              opacity: 1,
              translateY: [-70, 0],
            }}
            exit={{
              opacity: 0,
              translateY: 100,
              transition: {
                type: "just",
              },
            }}
            transition={{
              type: "spring",
              bounce: 0.7,
              bounceStiffness: 50,
            }}
          >
            <h3 className="text-lg font-semibold">Complete 🎉</h3>
            <button
              className="bg-blue-500 px-3 p-1 rounded-full shadow-md shadow-neutral-500 hover:bg-blue-600 hover:shadow-lg hover:shadow-neutral-600 active:bg-blue-600 active:shadow-sm active:shadow-neutral-700 transition-all duration-150 text-white font-semibold"
              onClick={() => {
                // to restart the whole process again , users can click on this button to remove the tags from the images
                socket.emit("resetData", {
                  email: authData.email,
                });
                setTaggingComplete(false);
                setShowLoader(true);
              }}
            >
              Reset Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Content;
