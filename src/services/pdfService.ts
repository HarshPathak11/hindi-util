// import jsPDF from 'jspdf';

// interface PDFOptions {
//   headerText: string;
//   bodyText: string;
//   footerText: string;
// }

// export async function generatePDF({ headerText, bodyText, footerText }: PDFOptions): Promise<Blob> {
//   return new Promise((resolve, reject) => {
//     try {
//       const pdf = new jsPDF({
//         orientation: 'portrait',
//         unit: 'mm',
//         format: 'a4',
//       });

//       // Set font to support Hindi (using built-in font as fallback)
//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const margin = 15;
//       const contentWidth = pageWidth - 2 * margin;

//       let yPosition = margin;

//       // Add header
//       if (headerText) {
//         pdf.setFontSize(10);
//         pdf.text(headerText, margin, yPosition, { maxWidth: contentWidth / 2 });
//         yPosition += 15;
//       }

//       // Add body text with word wrapping
//       pdf.setFontSize(11);
//       const lines = pdf.splitTextToSize(bodyText, contentWidth);

//       lines.forEach((line: string) => {
//         if (yPosition > pageHeight - margin - 10) {
//           pdf.addPage();
//           yPosition = margin;
//         }
//         pdf.text(line, margin, yPosition);
//         yPosition += 6;
//       });

//       // Add footer
//       if (footerText) {
//         const footerLines = pdf.splitTextToSize(footerText, contentWidth / 2);
//         let footerY = pageHeight - margin - footerLines.length * 6;

//         footerLines.forEach((line: string) => {
//           pdf.text(line, pageWidth - margin - contentWidth / 2, footerY);
//           footerY += 6;
//         });
//       }

//       // Convert to blob
//       const blob = pdf.output('blob');
//       resolve(blob);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

export interface PDFOptions {
  headerText: string;
  bodyText: string;
  footerText: string;
}

export async function generatePDF({
  headerText,
  bodyText,
  footerText,
}: PDFOptions): Promise<Blob> {
  const response = await fetch("http://localhost:5001/generate-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      headerText,
      bodyText,
      footerText,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate PDF");
  }

  return await response.blob(); // React downloads blob
}
