const express = require("express");
const upload = require("../config/multer");

const router = express.Router();

router.post("/image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: "No image uploaded" } });
  }
  res.json({ success: true, data: { url: req.file.path } });
});

module.exports = router;