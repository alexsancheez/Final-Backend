import PDFDocument from "pdfkit";
import cloudinaryService from "./cloudinary.service.js";

export const generatePdfBuffer = async (deliveryNote) => {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Albaran", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text("Empresa: " + (deliveryNote.company?.name || ""));
    doc.text("Cliente: " + (deliveryNote.client?.name || ""));
    doc.text("Proyecto: " + (deliveryNote.project?.name || ""));
    doc.moveDown();

    doc.text("Fecha: " + new Date(deliveryNote.workDate).toLocaleDateString("es-ES"));
    doc.text("Formato: " + deliveryNote.format);
    if (deliveryNote.description) {
      doc.text("Descripcion: " + deliveryNote.description);
    }
    doc.moveDown();

    if (deliveryNote.format === "material") {
      doc.text("Material: " + (deliveryNote.material || ""));
      doc.text("Cantidad: " + (deliveryNote.quantity || 0) + " " + (deliveryNote.unit || ""));
    }

    if (deliveryNote.format === "hours") {
      doc.text("Horas: " + (deliveryNote.hours || 0));
      if (deliveryNote.workers && deliveryNote.workers.length > 0) {
        doc.moveDown();
        doc.text("Trabajadores:");
        deliveryNote.workers.forEach((w) => {
          doc.text("  - " + w.name + ": " + w.hours + "h");
        });
      }
    }

    if (deliveryNote.signed && deliveryNote.signatureUrl) {
      doc.moveDown();
      doc.text("Firmado: " + new Date(deliveryNote.signedAt).toLocaleDateString("es-ES"));
      try {
        const response = await fetch(deliveryNote.signatureUrl);
        const buffer = Buffer.from(await response.arrayBuffer());
        doc.image(buffer, { width: 150 });
      } catch (err) {
        doc.text("[Firma no disponible]");
      }
    }

    doc.end();
  });
};

export const sendPdfResponse = async (deliveryNote, res) => {
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  doc.pipe(res);

  doc.fontSize(20).text("Albaran", { align: "center" });
  doc.moveDown();

  doc.fontSize(12);
  doc.text("Empresa: " + (deliveryNote.company?.name || ""));
  doc.text("Cliente: " + (deliveryNote.client?.name || ""));
  doc.text("Proyecto: " + (deliveryNote.project?.name || ""));
  doc.moveDown();

  doc.text("Fecha: " + new Date(deliveryNote.workDate).toLocaleDateString("es-ES"));
  doc.text("Formato: " + deliveryNote.format);
  if (deliveryNote.description) {
    doc.text("Descripcion: " + deliveryNote.description);
  }
  doc.moveDown();

  if (deliveryNote.format === "material") {
    doc.text("Material: " + (deliveryNote.material || ""));
    doc.text("Cantidad: " + (deliveryNote.quantity || 0) + " " + (deliveryNote.unit || ""));
  }

  if (deliveryNote.format === "hours") {
    doc.text("Horas: " + (deliveryNote.hours || 0));
    if (deliveryNote.workers && deliveryNote.workers.length > 0) {
      doc.moveDown();
      doc.text("Trabajadores:");
      deliveryNote.workers.forEach((w) => {
        doc.text("  - " + w.name + ": " + w.hours + "h");
      });
    }
  }

  if (deliveryNote.signed && deliveryNote.signatureUrl) {
    doc.moveDown();
    doc.text("Firmado: " + new Date(deliveryNote.signedAt).toLocaleDateString("es-ES"));
    try {
      const response = await fetch(deliveryNote.signatureUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      doc.image(buffer, { width: 150 });
    } catch (err) {
      doc.text("[Firma no disponible]");
    }
  }

  doc.end();
};
