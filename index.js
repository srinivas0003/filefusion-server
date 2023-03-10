const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const { mergePDFs } = require("./src/MergePDFs");
const bodyParser = require('body-parser');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const messageSchema = new Schema({
    name: String,
    email: String,
    message: String
});

// create a model
const Message = mongoose.model('message', messageSchema);

// Connect to MongoDB database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Error connecting to database', err));

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

// Middleware for parsing JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));



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

// Route to add a new message
app.post('/message', async (req, res) => {
  const { name, email, message } = req.body;
  const newMessage = new Message({ name, email, message });
  const messageCreated = await newMessage.save()
  if(messageCreated){
    res.status(201).json({ success: true, message: 'Message added' })
  }else{
    res.status(400).json({ success: false, message: err.message })
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
