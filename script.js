// ============================
// PC Doctor Invoicing - Version 1.02
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
// GENERATE PDF (with full footer)
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

    // FOOTER BLOCK
    y += 15;
    doc.setFontSize(11);

    const footerText = `
REGARDS
IAN PATANE
Dipl. Elec. Eng.
___________________________________________________
MANAGER

TERMS: Strictly C.O.D.

Payment Methods: Cheque, EFT
EFT DETAILS: Bank: CBA, BSB: 064100, ACCOUNT: 10005106, NAME: ORIGINAL PC DOCTOR

If using EFT you MUST email Internet Receipt Number after transfer. For reference
details, please put YOUR COMPANY NAME or INVOICE Number so that I can administer
payments quickly.

The property and items of this invoice remain the property and possession of the seller
and title to the goods does not pass to the purchaser until payment of this invoice
and any associated invoice for labour or additional goods is paid in full and where
paid by cheque, until such funds have been cleared in the seller’s bank account.

Where payment has not been made in full within the trading terms herein the seller
and its authorized agents and assigns hereby expressly reserve the right to recover
the goods and the purchaser expressly authorizes the seller to enter such premises
where the goods are located and to use such force as is reasonably necessary to effect
return of same without liability for trespass, damage or loss occasioned to the purchaser
in the course of such recovery. The purchaser hereby acknowledges and accepts
the terms of sale herein.
`;

    const footerLines = doc.splitTextToSize(footerText, 180);
    doc.text(footerLines, 15, y);

    // FINAL LINE
    doc.setFontSize(10);
    doc.text("Thank you for your business!", 105, 285, { align: "center" });

    doc.save(`Invoice-${invoiceNumber}.pdf`);
}

// ============================
// EMAIL BUTTON (manual attach workflow)
// ============================

function emailInvoice() {
    const clientName = document.getElementById("clientSelect").value || "";
    const clientEmail = clientName.includes(",") ? clientName.split(",")[1] : "";

    if (!clientEmail) {
        alert("No client email found.");
        return;
    }

    const subject = encodeURIComponent("Tax Invoice");
    const body = encodeURIComponent("Please find attached your tax invoice.\n\nRegards,\nOriginal PC Doctor");

    // Open Samsung Mail (or default email app) with TO, SUBJECT, BODY pre-filled
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${body}`;
}
