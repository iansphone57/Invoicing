// ============================
// PC Doctor Invoicing - Version 1.01
// ============================

const BUSINESS = {
    name: "Original PC Doctor",
    abn: "63159610829",
    phone: "34 222 007",
    mobile: "0403 168 740",
    email: "ian@pcdoc.net.au"
};

let allClients = []; // full client list for search/filter

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

    allClients = [...lines];

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
// CLIENT SEARCH FILTER
// ============================

function filterClients() {
    const search = document.getElementById("clientSearch").value.toLowerCase();
    const dropdown = document.getElementById("clientSelect");

    dropdown.innerHTML = "";

    const filtered = allClients.filter(c => c.toLowerCase().includes(search));

    const defaultOption = document.createElement("option");
    defaultOption.text = "Select a client";
    defaultOption.value = "";
    dropdown.appendChild(defaultOption);

    filtered.forEach(client => {
        const opt = document.createElement("option");
        opt.text = client;
        opt.value = client;
        dropdown.appendChild(opt);
    });
}

// ============================
// NEW CLIENT SUPPORT
// ============================

function showNewClientForm() {
    document.getElementById("newClientForm").style.display = "block";
}

function addNewClient() {
    const name = document.getElementById("newClientName").value.trim();
    const email = document.getElementById("newClientEmail").value.trim();

    if (!name || !email) {
        alert("Please enter both name and email");
        return;
    }

    const newEntry = `${name},${email}`;

    allClients.push(newEntry);

    filterClients();

    const dropdown = document.getElementById("clientSelect");
    dropdown.value = newEntry;

    document.getElementById("newClientForm").style.display = "none";
    document.getElementById("newClientName").value = "";
    document.getElementById("newClientEmail").value = "";

    downloadUpdatedCSV();
}

function downloadUpdatedCSV() {
    const entries = [...allClients];
    const csvContent = entries.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "clients-updated.csv";
    a.click();

    URL.revokeObjectURL(url);
}

// ============================
// ADD ROW (Row 1 = Travel, Row 2+ = Parts)
// ============================

function addRow() {
    const container = document.getElementById("rows");
    const rowCount = container.querySelectorAll(".invoice-row").length;

    const div = document.createElement("div");
    div.className = "invoice-row";

    let defaultType = "Travel";
    if (rowCount >= 1) defaultType = "Parts";

    div.innerHTML = `
        <select class="descSelect">
            <option ${defaultType === "Travel" ? "selected" : ""}>Travel</option>
            <option ${defaultType === "Parts" ? "selected" : ""}>Parts</option>
            <option ${defaultType === "Labour" ? "selected" : ""}>Labour</option>
            <option ${defaultType === "Other" ? "selected" : ""}>Other</option>
        </select>

        <input type="text" class="descInput" placeholder="Description (optional)">
        <input type="number" class="amount" placeholder="Amount">
    `;

    container.appendChild(div);
}

// ============================
// GENERATE PDF
// ============================

async function generatePDF() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Tax Invoice", 105, 20, { align: "center" });

    // BUSINESS DETAILS
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text(BUSINESS.name, 20, 35);
    doc.text(`ABN: ${BUSINESS.abn}`, 20, 42);
    doc.text(`Phone: ${BUSINESS.phone}`, 20, 49);
    doc.text(`Mobile: ${BUSINESS.mobile}`, 20, 56);
    doc.text(`Email: ${BUSINESS.email}`, 20, 63);

    // CLIENT NAME
    const clientName = document.getElementById("clientSelect").value || "Client";

    doc.setFontSize(14);
    doc.text("Invoice To:", 20, 80);
    doc.setFontSize(12);
    doc.text(clientName, 20, 87);

    // INVOICE NUMBER + DATE
    const today = new Date();
    const dateStr = today.toLocaleDateString("en-AU");

    const initials = clientName
        ? clientName.split(" ").map(w => w[0]).join("").toUpperCase()
        : "INV";

    const invoiceNumber = `${initials}${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

    doc.text(`Invoice #: ${invoiceNumber}`, 150, 35);
    doc.text(`Date: ${dateStr}`, 150, 42);

    // READ DYNAMIC ROWS
    let y = 110;
    const rows = document.querySelectorAll(".invoice-row");

    rows.forEach(row => {
        const type = row.querySelector(".descSelect").value;
        const desc = row.querySelector(".descInput").value.trim();
        const amount = row.querySelector(".amount").value.trim();

        if (amount !== "") {
            doc.setFontSize(12);
            doc.text(type, 20, y);
            doc.text(`$${amount}`, 180, y, { align: "right" });
            y += 7;

            if (desc !== "") {
                doc.setFontSize(11);
                doc.text(desc, 25, y);
                y += 7;
            }
        }
    });

    // TOTALS
    let subtotal = 0;
    rows.forEach(row => {
        const amount = parseFloat(row.querySelector(".amount").value) || 0;
        subtotal += amount;
    });

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    y += 10;
    doc.setFontSize(12);
    doc.text("Subtotal:", 120, y);
    doc.text(`$${subtotal.toFixed(2)}`, 180, y, { align: "right" });

    y += 7;
    doc.text("GST (10%):", 120, y);
    doc.text(`$${gst.toFixed(2)}`, 180, y, { align: "right" });

    y += 7;
    doc.text("Total:", 120, y);
    doc.text(`$${total.toFixed(2)}`, 180, y, { align: "right" });

    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 285, { align: "center" });

    doc.save(`Invoice-${invoiceNumber}.pdf`);
}

// ============================
// EMAIL INVOICE (Option A)
// ============================

async function emailInvoice() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Build PDF (same as generatePDF)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("Tax Invoice", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(BUSINESS.name, 20, 35);
    doc.text(`ABN: ${BUSINESS.abn}`, 20, 42);
    doc.text(`Phone: ${BUSINESS.phone}`, 20, 49);
    doc.text(`Mobile: ${BUSINESS.mobile}`, 20, 56);
    doc.text(`Email: ${BUSINESS.email}`, 20, 63);

    const clientName = document.getElementById("clientSelect").value || "Client";
    const clientEmail = clientName.includes(",") ? clientName.split(",")[1] : "";

    doc.setFontSize(14);
    doc.text("Invoice To:", 20, 80);
    doc.setFontSize(12);
    doc.text(clientName, 20, 87);

    const today = new Date();
    const dateStr = today.toLocaleDateString("en-AU");
    const initials = clientName ? clientName.split(" ").map(w => w[0]).join("").toUpperCase() : "INV";
    const invoiceNumber = `${initials}${today.getFullYear()}${String(today.getMonth()+1).padStart(2,"0")}${String(today.getDate()).padStart(2,"0")}`;

    doc.text(`Invoice #: ${invoiceNumber}`, 150, 35);
    doc.text(`Date: ${dateStr}`, 150, 42);

    let y = 110;
    const rows = document.querySelectorAll(".invoice-row");

    rows.forEach(row => {
        const type = row.querySelector(".descSelect").value;
        const desc = row.querySelector(".descInput").value.trim();
        const amount = row.querySelector(".amount").value.trim();

        if (amount !== "") {
            doc.setFontSize(12);
            doc.text(type, 20, y);
            doc.text(`$${amount}`, 180, y, { align: "right" });
            y += 7;

            if (desc !== "") {
                doc.setFontSize(11);
                doc.text(desc, 25, y);
                y += 7;
            }
        }
    });

    let subtotal = 0;
    rows.forEach(row => {
        const amount = parseFloat(row.querySelector(".amount").value) || 0;
        subtotal += amount;
    });

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    y += 10;
    doc.setFontSize(12);
    doc.text("Subtotal:", 120, y);
    doc.text(`$${subtotal.toFixed(2)}`, 180, y, { align: "right" });

    y += 7;
    doc.text("GST (10%):", 120, y);
    doc.text(`$${gst.toFixed(2)}`, 180, y, { align: "right" });

    y += 7;
    doc.text("Total:", 120, y);
    doc.text(`$${total.toFixed(2)}`, 180, y, { align: "right" });

    // Convert PDF to Base64
    const pdfBase64 = doc.output("datauristring");

    // Build email
    const subject = encodeURIComponent(`Tax Invoice - ${clientName}`);
    const body = encodeURIComponent("Please find attached your tax invoice.\n\nRegards,\nOriginal PC Doctor");

    // Open email app
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
}
