const PDFMake = require('pdfmake');
import fs from 'fs';
import path from 'path';

const fonts = {
  thmanyah: {
    normal: path.join(process.cwd(), 'public/fonts/thmanyahsans-Regular.otf'),
    bold: path.join(process.cwd(), 'public/fonts/thmanyahsans-Bold.otf'),
  }
};

const printer = new PDFMake(fonts);
const doc = printer.createPdfKitDocument({
  content: [
    { text: 'تقرير اختبار', fontSize: 18, alignment: 'right' },
    { text: 'هذا نص عربي للتجربة.', fontSize: 12, alignment: 'right' },
  ],
  defaultStyle: { font: 'thmanyah' },
});

doc.pipe(fs.createWriteStream('/tmp/test-ar.pdf'));
doc.end();
console.log('PDF written');
