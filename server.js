const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const session = require("express-session");

const app = express();


const PORT = process.env.PORT || 8080;

app.use(bodyparser.urlencoded({ extended: true }));

app.use(bodyparser.json());

app.set("view engine", "ejs");

app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "Assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));

app.use("/", require("./Server/routes/router"));

var server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const io = require("socket.io")(server, {
  allowEIO3: true, 
});

var userConnection = [];

io.on("connection", (socket) => {
  console.log("Socket id is: ", socket.id);
  socket.emit("mySocketId", socket.id);
  socket.on("userconnect", (data) => {
    console.log("Logged in username", data.displayName);
    userConnection.push({
      connectionId: socket.id,
      user_id: data.displayName,
      engaged: false,
    });
    userConnection.map(function (user) {
      const use = { "userid: ": user.user_id, Engaged: user.engaged };
      console.log(use);
    });
  });
  socket.on("findUnengagedUser", (data) => {
    const unengagedUser = userConnection.find(
      (user) => !user.engaged && user.connectionId !== socket.id
    );

    if (unengagedUser) {
      const senderUser = userConnection.find(
        (user) => user.connectionId === socket.id
      );
      if (senderUser) {
        senderUser.engaged = true;
        console.log("UserUser is", senderUser);
      }

      unengagedUser.engaged = true;
      socket.emit("startChat", unengagedUser.connectionId);
      console.log("engaged user", unengagedUser.engaged);
    }
  });
  socket.on("findNextUnengagedUser", (data) => {
    const availableUsers = userConnection.filter(
      (user) =>
        !user.engaged &&
        user.connectionId !== socket.id &&
        user.connectionId !== data.remoteUser
    );
        if (availableUsers.length > 0) {
      const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
      randomUser.engaged = true;
      socket.emit("startChat", randomUser.connectionId);
    }
  });
});


