const PDFMerger = require("pdf-merger-js");
const fs = require("fs");

const mergePDFs = async (files) => {
  const merger = new PDFMerger();
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    await merger.add(file);
  }
  await merger.save("results/merged.pdf");  
};

module.exports = { mergePDFs };
