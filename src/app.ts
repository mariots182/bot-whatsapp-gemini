import express from "express";
import cors from "cors";
import routes from "./routes/routes";
import config from "./config";
import { HTTP } from "./utils/consts";

const { corsOrigin, port } = config.app;
const {
  METHODS: { GET, POST },
  HEADERS: { CONTENT_TYPE, AUTHORIZATION },
} = HTTP;

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: corsOrigin,
    methods: [GET, POST],
    allowedHeaders: [CONTENT_TYPE, AUTHORIZATION],
  }),
);

app.use(routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
