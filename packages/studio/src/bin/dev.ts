import express from "express";
import expressWebsockets from "express-ws";
import { createHocuspocus } from "./hocuspocus";
import { getCore } from "@/lib/config";
import { studioHook } from "@/lib/content";

function run() {
  const { app } = expressWebsockets(express());
  global.HOCUSPOCUS_ENV = {
    getCore: getCore,
    getPluginHook() {
      return studioHook;
    },
  };
  createHocuspocus(app);
  app.listen(8080, () => {
    console.log("hocuspocus server ready at port 8080");
  });
}

run();
