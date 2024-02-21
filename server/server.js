const dotenv = require("dotenv");
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { passport } = require("./auth");
const path = require("path");
const mongoose = require("mongoose");
const { ImageTagCollection } = require("./schema/ImagesCollection");
const { UserCollection } = require("./schema/UserCollection");
let paginationStatus = {
  skip: 0,
  top: 10,
  count: -1,
  loadingData: false,
  noDataLeft: false,
  paginationSkip: 10,
  paginationThreshold: 5,
};
let resetRequested = false;
let leftCount = 0;
let ImageQueue = [];
const userObject = {};
if (process.env.NODE_ENV != undefined) {
  let env = process.env.NODE_ENV.trim();
  let path = "";

  switch (env) {
    case "development":
      path = "./.env";
      break;
    case "production":
      path = "./.env.production";
  }
  dotenv.config({
    path: path,
  });
}

const PORT = process.env.PORT || 9000;
const app = express();
console.log(process.env.LABEL);
app.use(express.static(path.join(__dirname, "dist")));
app.use(passport.initialize());
app.use(cors());
app.use(cookieParser());

async function getLeftCount() {
  let count = await ImageTagCollection.find({
    assigned: false,
    assignedTo: "",
  }).countDocuments();
  leftCount = count;
  socketIO.emit("counter", {
    count: count,
  });
}
// for getting images from the database
async function getImages(skip, top) {
  if (paginationStatus.count == -1 || paginationStatus.count != 0) {
    socketIO.emit("loadingData");

    paginationStatus.loadingData = true;
    let skipVal = 0;
    if (ImageQueue.length == 0) {
      skipVal = 0;
    } else if (ImageQueue.length <= paginationStatus.count) {
      skipVal = ImageQueue.length;
    } else if (ImageQueue.length > paginationStatus.count) {
      skipVal = 0;
    }
    let data = await ImageTagCollection.aggregate([
      {
        $match: {
          $and: [
            {
              assigned: false,
            },
            {
              assignedTo: "",
            },
          ],
        },
      },
      {
        $skip: skipVal,
      },
      {
        $limit: top,
      },
    ]);

    let count = await ImageTagCollection.aggregate([
      {
        $match: {
          $and: [
            {
              assigned: false,
            },
            {
              assignedTo: "",
            },
          ],
        },
      },
      {
        $skip: data.length + ImageQueue.length,
      },
      {
        $count: "untaggedImageCount",
      },
    ]);
    
    await getLeftCount();
    socketIO.emit("loadingComplete");

    paginationStatus.loadingData = false;
    return {
      data: data,
      count: count.length == 1 ? count[0].untaggedImageCount : 0,
    };
  } else {
    paginationStatus.noDataLeft = true;
    return null;
  }
}

// function called for the initial data call from the db
async function defineModel() {
  let data = await getImages(
    paginationStatus.skip,
    paginationStatus.top,
    false
  );

  ImageQueue = data.data;
  paginationStatus.skip += paginationStatus.paginationSkip;
  paginationStatus.count = data.count;
}

const http = app.listen(PORT, async () => {
  mongoose.connect(
    `mongodb+srv://${process.env.MONGOUSER}:${process.env.MONGOPASS}@cluster0.uaqcb6e.mongodb.net/ImageTag?retryWrites=true&w=majority`
  );
  defineModel();
  console.log(`App running on ${PORT}`);
});
const socketIO = require("socket.io")(http, {
  cors: {
    origin: process.env.CLIENT_URL,
  },
});

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user just connected!`);
  socket.emit("connected", {
    data: "success",
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
  socket.on("registerUser", async (data) => {
    
      
    if (userObject[data.email] != undefined) {
      userObject[data.email].instanceSet.add(socket.id);
      userObject[data.email].instances =
        userObject[data.email].instanceSet.size;
      if (userObject[data.email].instances > 1) {
        
        socket.emit("multipleUsers");
       
      }
    } else {
      userObject[data.email] = data;
      userObject[data.email].instanceSet = new Set([socket.id]);
      socket.emit("startTagging");
    }

    console.log(`${socket.id} has email - ${data.email}`);
    socketIO.emit("activeUsers", {
      count: Object.keys(userObject).length,
      users: Object.values(userObject).map((item) => {
        return {
          image: item.image,
          email: item.email,
        };
      }),
    });
    //storing the user info in db
    await UserCollection.findOneAndUpdate(
      {
        email: data.email,
      },
      {
        email: data.email,
      },
      {
        new: true,
        upsert: true,
      }
    );
    socketIO.emit("counter", {
      count: leftCount,
    });
  });
  socket.on("provideImage", async (data) => {
    //maintaining the queue for providing the data to the client side
    if (ImageQueue.length == 0 && paginationStatus.count == 0) {
      socketIO.emit("taggingCompletedForAllImages");
    }
    if (ImageQueue.length == 0 && paginationStatus.loadingData == true) {
      socketIO.emit("loadingData");
    } else {
      let alreadyAssigned = ImageQueue.findIndex((item) => {
        if (item.assigned == true && item.assignedTo == data.email) {
          return true;
        }
      });
      if (alreadyAssigned != -1) {
        socket.emit("receiveData", {
          data: ImageQueue[alreadyAssigned],
        });
        return;
      }
      let untaggedImages = ImageQueue.filter((item) => {
        if (item.assigned == false) {
          return true;
        }
      });

      let firstUntaggedImageIndex = ImageQueue.findIndex((item) => {
        if (item.assigned == false) {
          return true;
        }
      });
      if (firstUntaggedImageIndex == -1) {
        if (paginationStatus.count == 0) {
          if (ImageQueue.length == 0) {
            socketIO.emit("taggingCompletedForAllImages");
          } else {
            socketIO.emit("pendingCompletion");
          }
        }
        return;
      }
      let shouldGetImages = false;
      if (untaggedImages.length <= paginationStatus.paginationThreshold) {
        shouldGetImages = true;
      }
      ImageQueue[firstUntaggedImageIndex].assigned = true;
      ImageQueue[firstUntaggedImageIndex].assignedTo = data.email;
      socket.emit("receiveData", {
        data: ImageQueue[firstUntaggedImageIndex],
      });

      if (
        shouldGetImages == true &&
        paginationStatus.noDataLeft == false &&
        paginationStatus.loadingData == false &&
        paginationStatus.count != 0
      ) {
        //paginated db call
        let data = await getImages(
          paginationStatus.skip,
          paginationStatus.top,
          true
        );
      
        if (data != null) {
          ImageQueue.push(...data.data);
          paginationStatus.skip += paginationStatus.paginationSkip;
          paginationStatus.count = data.count;
        }
      }
    }
  });
  socket.on("logoutUser", (data) => {
    if (
      userObject[data.email] != undefined &&
      userObject[data.email].instances == 1
    ) {
      delete userObject[data.email];
      let imageQueueIndex = ImageQueue.findIndex((item) => {
        if (item.assigned == true && item.assignedTo == data.email) {
          return true;
        }
      });
      if (imageQueueIndex != -1) {
        ImageQueue[imageQueueIndex].assigned = false;
        ImageQueue[imageQueueIndex].assignedTo = "";
      }
      socket.emit("logoutConfirm");
      socketIO.emit("activeUsers", {
        count: Object.keys(userObject).length,
      });
    } else if (
      userObject[data.email] != undefined &&
      userObject[data.email].instances > 1
    ) {
      let socketIndex = Array.from(
        userObject[data.email].instanceSet
      ).findIndex((item) => {
        return item == socket.id;
      });
      if (socketIndex != -1) {
        userObject[data.email].instanceSet.delete(socket.id);
        socket.emit("logoutConfirm");
        socketIO.emit("activeUsers", {
          count: Object.keys(userObject).length,
        });
      }
      if (userObject[data.email].instanceSet.size == 1) {
        let imageQueueIndex = ImageQueue.findIndex((item) => {
          if (item.assigned == true && item.assignedTo == data.email) {
            return true;
          }
        });
        if (imageQueueIndex != -1) {
          ImageQueue[imageQueueIndex].assigned = false;
          ImageQueue[imageQueueIndex].assignedTo = "";
        }
        socketIO
          .to(Array.from(userObject[data.email].instanceSet)[0])
          .emit("startTagging");
      }
    }
    socketIO.emit("activeUsers", {
      count: Object.keys(userObject).length,
      users: Object.values(userObject).map((item) => {
        return {
          image: item.image,
          email: item.email,
        };
      }),
    });
  });
  socket.on("logoutEveryWhereClient", (data) => {
    //forcing logout for associated client(s) with same email
    if (userObject[data.email] != undefined) {
      let userInstances = Array.from(userObject[data.email].instanceSet);

      function emitter(n) {
        if (n == -1) {
          let imageQueueIndex = ImageQueue.findIndex((item) => {
            if (item.assigned == true && item.assignedTo == data.email) {
              return true;
            }
          });
          // after logging out, we need to remove the assignment of previous user , inorder to provide this data to other client
          if (imageQueueIndex != -1) {
            ImageQueue[imageQueueIndex].assigned = false;
            ImageQueue[imageQueueIndex].assignedTo = "";
          }
          delete userObject[data.email];
          return;
        }
        socketIO.to(userInstances[n]).emit("logoutEveryWhereServer");
        emitter(n - 1);
      }
      emitter(userInstances.length - 1);
    }
  });

  socket.on("imageTagged", async (data) => {
    let tag = data.tag;
    let email = data.email;

    let associatedImageIndex = ImageQueue.findIndex(
      (item) => item.assignedTo == email
    );

    
    let imageId = data._id;
    ImageQueue.splice(associatedImageIndex, 1);
      // updating the tags in the db
    await ImageTagCollection.updateOne(
      {
        _id: imageId,
      },
      {
        $set: {
          tag: tag,
          assigned: true,
          assignedTo: data.email,
        },
      }
    );

    await getLeftCount();
  });
  socket.on("resetData", async (data) => {
    
    if (resetRequested == false) {
      resetRequested = true;
      //resetting the data in db
      await ImageTagCollection.updateMany(
        {},
        {
          $set: {
            tag: "",
            assigned: false,
            assignedTo: "",
          },
        }
      );

      paginationStatus = {
        skip: 0,
        top: 10,
        count: -1,
        loadingData: false,
        noDataLeft: false,
        paginationSkip: 10,
        paginationThreshold: 5,
      };
      ImageQueue = [];
      await defineModel();
      socketIO.emit("dataResetComplete");
      resetRequested = false;
    }
  });
  socket.on("userDisconnected", (data) => {
    console.log("diconnected user");
    if (userObject[data.email] != undefined) {
      userObject[data.email].instanceSet.delete(socket.id);
      if (userObject[data.email].instanceSet.size == 0) {
        delete userObject[data.email];
      }
    }
  });
});

app.get("/api/validateToken", (req, res) => {
  debugger;
  if (req.cookies != undefined && req.cookies.loginCookie != undefined) {
    try {
      let isValid = jwt.verify(req.cookies.loginCookie, process.env.JWT_SECRET);
      res.status(200).json({
        valid: true,
        token: req.cookies.loginCookie,
      });
    } catch (err) {
      res.status(500).json({
        valid: false,
      });
    }
  } else {
    res.status(500).json({
      valid: false,
    });
  }
});

app.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

app.get(
  "/api/auth/google/callback",
  passport.authenticate("google", {
    session: false,
  }),
  (req, res) => {
    debugger;

    let userIdPayload = {
      email: req.user.email,
      displayName: req.user.displayName,
      picture: req.user.picture,
    };
    // signing custom JWT Token
    let token = jwt.sign(userIdPayload, process.env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24 * 7,
    });
    res.cookie("loginCookie", token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });

    res.redirect(process.env.REDIRECT_URL.trim() + "/");
  }
);

app.get("/api/logout", (req, res) => {
  res.cookie("loginCookie", "", {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
  });
  res.status(200).json({
    message: "done",
  });
});

app.get("/*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
