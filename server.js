const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const { errorHandler } = require("./src/middleware/errorMiddleware");
const { sequelize } = require("./models");
const cors = require("cors");
const session = require("express-session");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/swagger");
const swaggerDocs = require("./src/swagger");
const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
  }
});

app.use(
  session({
    secret: process.env.SECRET_KEY || 'secret_key', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, 
  })
);

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/users", require("./src/routes/userRoutes"));

app.use(errorHandler);

swaggerDocs(app);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
  });
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully.");
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
      console.log(`Swagger UI is available http://localhost:${port}/api-docs`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

  