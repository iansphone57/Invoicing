async function generatePDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // REGISTER THE FONT (headhunter.js already loaded it into VFS)
    doc.addFont("headhunter.ttf", "headhunter", "normal");

    // ============================
    // HEADER
    // ============================
    doc.setFont("headhunter", "normal");
    doc.setFontSize(28);
    doc.text("ORIGINAL PC DOCTOR", 105, 20, { align: "center" });

    // Switch back to Helvetica for the rest
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // ============================
    // BUSINESS DETAILS (EVEN SPACING)
    // ============================
    doc.text("Phone: 0402 026 000", 20, 35);
    doc.text("Mobile: 0402 026 000", 20, 42);
    doc.text("Email: originalpcdoctor@gmail.com", 20, 49);

    // ============================
    // CLIENT DETAILS
    // ============================
    const clientName = document.getElementById("clientName").value;
    const clientAddress = document.getElementById("clientAddress").value;

    doc.setFontSize(14);
    doc.text("Invoice To:", 20, 65);
    doc.setFontSize(12);
    doc.text(clientName, 20, 72);
    doc.text(clientAddress, 20, 79);

    // ============================
    // INVOICE NUMBER + DATE
    // ============================
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-AU");

    // Invoice number: initials + YYYYMMDD
    const initials = clientName.split(" ").map(w => w[0]).join("").toUpperCase();
    const invoiceNumber = `${initials}${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

    doc.text(`Invoice #: ${invoiceNumber}`, 150, 35);
    doc.text(`Date: ${dateStr}`, 150, 42);

    // ============================
    // LINE ITEMS
    // ============================
    let y = 100;

    function addLine(label, amount, description) {
        if (amount && amount.trim() !== "") {
            doc.text(label, 20, y);
            doc.text(`$${amount}`, 180, y, { align: "right" });
            y += 7;

            if (description && description.trim() !== "") {
                doc.setFontSize(11);
                doc.text(description, 25, y);
                doc.setFontSize(12);
                y += 7;
            }
        }
    }

    const partsAmount = document.getElementById("partsAmount").value;
    const partsDesc = document.getElementById("partsDesc").value;

    const labourAmount = document.getElementById("labourAmount").value;
    const labourDesc = document.getElementById("labourDesc").value;

    const calloutAmount = document.getElementById("calloutAmount").value;
    const otherAmount = document.getElementById("otherAmount").value;

    addLine("Parts", partsAmount, partsDesc);
    addLine("Labour", labourAmount, labourDesc);
    addLine("Callout Fee", calloutAmount);
    addLine("Other", otherAmount);

    // ============================
    // TOTALS
    // ============================
    const subtotal =
        (parseFloat(partsAmount) || 0) +
        (parseFloat(labourAmount) || 0) +
        (parseFloat(calloutAmount) || 0) +
        (parseFloat(otherAmount) || 0);

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    y += 10;
    doc.setFontSize(14);
    doc.text("Subtotal:", 140, y);
    doc.text(`$${subtotal.toFixed(2)}`, 200, y, { align: "right" });

    y += 8;
    doc.text("GST (10%):", 140, y);
    doc.text(`$${gst.toFixed(2)}`, 200, y, { align: "right" });

    y += 8;
    doc.setFontSize(16);
    doc.text("Total:", 140, y);
    doc.text(`$${total.toFixed(2)}`, 200, y, { align: "right" });

    // ============================
    // FOOTER
    // ============================
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 285, { align: "center" });

    // ============================
    // SAVE PDF
    // ============================
    doc.save(`Invoice-${invoiceNumber}.pdf`);
}
