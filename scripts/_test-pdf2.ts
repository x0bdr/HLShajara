const pdfmake = require('pdfmake');
import fs from 'fs';
import path from 'path';

(pdfmake as any).fonts = {
  thmanyah: {
    normal: path.join(process.cwd(), 'public/fonts/thmanyahsans-Regular.otf'),
    bold: path.join(process.cwd(), 'public/fonts/thmanyahsans-Bold.otf'),
  }
};

const doc = (pdfmake as any).createPdf({
  content: [
    { text: 'تقرير اختبار', fontSize: 18, alignment: 'right' },
    { text: 'هذا نص عربي للتجربة.', fontSize: 12, alignment: 'right' },
  ],
  defaultStyle: { font: 'thmanyah' },
});

doc.getStream().pipe(fs.createWriteStream('/tmp/test-ar2.pdf'));
doc.end();
console.log('PDF written');
