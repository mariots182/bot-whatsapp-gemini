import express from "express";
import cors from "cors";
import routes from "./routes/routes";
import config from "./config";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(routes);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
