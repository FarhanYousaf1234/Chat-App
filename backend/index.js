const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const multer = require("multer");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// MongoDB connection
mongoose.connect(
  "mongodb+srv://shiekhfarhanyousaf1813:farhan1234@cluster0.einbzzv.mongodb.net/MERN_CHAT",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;

db.on("error", (error) => {
  console.error("MongoDB connection error:", error);
});

db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Create a mongoose model for File
const File = mongoose.model("File", {
  data: Buffer, // Store file data as a Buffer
  contentType: String, // Store content type (e.g., image/png)
});

// Configure Multer to handle file uploads
const storage = multer.memoryStorage(); // Store files in memory as Buffer
const upload = multer({ storage: storage });

// Route to handle file uploads
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const file = new File({
    data: req.file.buffer,
    contentType: req.file.mimetype,
  });

  try {
    const savedFile = await file.save();
    return res.status(200).json({ message: "File uploaded successfully.", file: savedFile });
  } catch (error) {
    console.error("Error saving file:", error);
    return res.status(500).json({ message: "Error saving file." });
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (data) => {
    socket.join(data);
    console.log(`User with ID: ${socket.id} joined room: ${data}`);
  });

  socket.on("send_message", async (data) => {
    if (data.file) {
      const file = new File({
        data: data.file,
        contentType: data.contentType,
      });

      try {
        await file.save();
        data.file = file.id;
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }

    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

server.listen(3001, () => {
  console.log("SERVER RUNNING");
});
