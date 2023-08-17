import { createContext } from "react";

const DatasetContext = createContext({
  dataset: "default",
  setDataset: (dataset:String) => {}
});

export default DatasetContext;