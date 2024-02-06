import { source } from "fuma-content";
import entry from "./dist/index";

const documents = source(entry, {});

console.log(documents);
