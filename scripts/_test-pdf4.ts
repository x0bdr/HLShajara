const pdfmake = require('pdfmake');
import fs from 'fs';
import path from 'path';

(pdfmake as any).setLocalAccessPolicy(() => true);
(pdfmake as any).setUrlAccessPolicy(() => true);
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

const buffer = await new Promise<Buffer>((resolve, reject) => {
  doc.getBuffer((buf: Buffer) => resolve(buf));
});
fs.writeFileSync('/tmp/test-ar4.pdf', buffer);
console.log('PDF written', buffer.length);
