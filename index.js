const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const { mergePDFs } = require("./src/MergePDFs");

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const filename = Date.now();

    cb(null, filename + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/merge", upload.array("files"), async (req, res) => {
  const files = req.files.map((file) => file.path);
  const fileType = req.body.fileType;
  let downloadFile = "";

  switch (fileType) {
    case "pdf":
      await mergePDFs(files);
      downloadFile = "merged.pdf";
      break;
    default:
      res.json({ error: "File type not supported" });
      break;
  }

  if (downloadFile) {
    res.download(path.join(__dirname, `results/${downloadFile}`), (err) => {
      if (!err) {
        // delete all the files after merging
        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          fs.unlinkSync(file);
        }

        // delete the merged file
        fs.unlinkSync(path.join(__dirname, `results/${downloadFile}`));
      }else{
        res.json({ error: err });
      }
    });
  } else {
    res.json({ error: "File type not supported" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
