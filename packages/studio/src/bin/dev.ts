import express from "express";
import expressWebsockets from "express-ws";
import { createHocuspocus } from "./hocuspocus";

function run() {
  const { app } = expressWebsockets(express());
  createHocuspocus(app);
  app.listen(8080, () => {
    console.log("hocuspocus server ready at port 8080");
  });
}

run();
