const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

app.post('/compress', upload.single('pdf'), async (req, res) => {
  try {
    const filePath = req.file.path;
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const compressionLevel = parseInt(req.body.level) || 50;

    pdfDoc.setTitle('Compressed PDF');
    const compressedBytes = await pdfDoc.save({ useObjectStreams: false });

    const outputFile = `compressed-${req.file.originalname}`;
    const outputPath = path.join('compressed', outputFile);
    fs.writeFileSync(outputPath, compressedBytes);

    const originalSize = fs.statSync(filePath).size;
    const compressedSize = fs.statSync(outputPath).size;

    res.json({
      success: true,
      fileName: req.file.originalname,
      originalSize,
      compressedSize,
      url: `/download/${outputFile}`
    });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Compression failed' });
  }
});

app.use('/download', express.static('compressed'));

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
