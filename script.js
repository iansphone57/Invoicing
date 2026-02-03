// ============================
// PC Doctor Invoicing - Version 1.03
// ============================

// ============================
// LOAD CLIENTS CSV
// ============================

function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        parseClientsCSV(text);
    };

    reader.readAsText(file);
}

function parseClientsCSV(csvText) {
    const lines = csvText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

    const dropdown = document.getElementById("clientSelect");
    dropdown.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.text = "Select a client";
    defaultOption.value = "";
    dropdown.appendChild(defaultOption);

    lines.forEach(line => {
        const option = document.createElement("option");
        option.text = line;
        option.value = line;
        dropdown.appendChild(option);
    });
}

// ============================
// ADD ROW
// ============================

function addRow() {
    const container = document.getElementById("rows");

    const div = document.createElement("div");
    div.className = "invoice-row";

    div.innerHTML = `
        <select class="descSelect">
            <option>Travel</option>
            <option>Parts</option>
            <option>Labour</option>
            <option>Other</option>
        </select>

        <input type="text" class="descInput" placeholder="Description (optional)">
        <input type="number" class="amount" placeholder="Amount">
    `;

    container.appendChild(div);
}

// ============================
// GENERATE PDF (VERSION 1.03)
// ============================

async function generatePDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("ORIGINAL PC DOCTOR", 105, 20, { align: "center" });

    // BUSINESS DETAILS
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text("Phone: 0402 026 000", 20, 35);
    doc.text("Mobile: 0402 026 000", 20, 42);
    doc.text("Email: originalpcdoctor@gmail.com", 20, 49);

    // CLIENT NAME (from dropdown)
    const clientName = document.getElementById("clientSelect").value || "Client";

    doc.setFontSize(14);
    doc.text("Invoice To:", 20, 65);
    doc.setFontSize(12);
    doc.text(clientName, 20, 72);

    // INVOICE NUMBER + DATE
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-AU");

    const initials = clientName
        ? clientName.split(" ").map(w => w[0]).join("").toUpperCase()
        : "INV";

    const invoiceNumber = `${initials}${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

    doc.text(`Invoice #: ${invoiceNumber}`, 150, 35);
    doc.text(`Date: ${dateStr}`, 150, 42);

    // ============================
    // READ DYNAMIC ROWS
    // ============================

    let y = 100;

    const rows = document.querySelectorAll(".invoice-row");

    rows.forEach(row => {
        const type = row.querySelector(".descSelect").value;
        const desc = row.querySelector(".descInput").value.trim();
        const amount = row.querySelector(".amount").value.trim();

        if (amount !== "") {
            doc.text(type, 20, y);
            doc.text(`$${amount}`, 180, y, { align: "right" });
            y += 7;

            if (desc !== "") {
                doc.setFontSize(11);
                doc.text(desc, 25, y);
                doc.setFontSize(12);
                y += 7;
            }
        }
    });

    // ============================
    // TOTALS
    // ============================

    let subtotal = 0;

    rows.forEach(row => {
        const amount = parseFloat(row.querySelector(".amount").value) || 0;
        subtotal += amount;
    });

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

    // FOOTER
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 285, { align: "center" });

    // SAVE PDF
    doc.save(`Invoice-${invoiceNumber}.pdf`);
}
