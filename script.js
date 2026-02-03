// =========================
// GLOBAL CLIENT STORAGE
// =========================
let clients = [];

// =========================
// CSV UPLOAD HANDLER
// =========================
function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

// =========================
// CSV PARSER
// =========================
function parseCSV(text) {
    clients = [];
    const lines = text.split("\n");

    lines.forEach(line => {
        const [name, email] = line.split(",");
        if (name && email) {
            clients.push({
                name: name.trim(),
                email: email.trim()
            });
        }
    });

    populateClientDropdown();
}

// =========================
// POPULATE CLIENT DROPDOWN
// =========================
function populateClientDropdown() {
    const select = document.getElementById("clientSelect");
    select.innerHTML = "";

    clients.forEach((client, index) => {
        const opt = document.createElement("option");
        opt.value = index;
        opt.textContent = client.name;
        select.appendChild(opt);
    });
}

// =========================
// INVOICE NUMBER GENERATOR
// =========================
function generateInvoiceNumber(name) {
    const parts = name.trim().split(" ");
    const last = parts[parts.length - 1][0].toUpperCase();
    const first = parts[0][0].toUpperCase();

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");

    return `${last}${first}${yy}${mm}${dd}`;
}

// =========================
// DATE FORMATTER
// =========================
function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// =========================
// MONOSPACE DIGIT MAP
// =========================
const monoDigits = {
    "0": "𝟶", "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺",
    "5": "𝟻", "6": "𝟼", "7": "𝟽", "8": "𝟾", "9": "𝟿",
    ".": "․",
    "$": "＄"
};

// Convert normal number string → monospace number string
function monoNum(str) {
    return str.split("").map(ch => monoDigits[ch] || ch).join("");
}

// =========================
// SEND INVOICE
// =========================
function sendInvoice() {

    const PAD = "\u2008"; // punctuation space
    const COL_WIDTH = 80;
    const MAX_LABEL = 50;

    const clientSelect = document.getElementById('clientSelect');
    const clientIndex = clientSelect.value;

    if (clientIndex === '') {
        alert('Please select a client.');
        return;
    }

    const client = clients[clientIndex];
    const invoiceNumber = generateInvoiceNumber(client.name);

    const rows = document.querySelectorAll('.invoice-row');

    let items = [];
    let subtotal = 0;

    rows.forEach(row => {
        const dropdown = row.querySelector('.descSelect');
        const descInput = row.querySelector('.descInput');
        const amountInput = row.querySelector('.amount');

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) return;

        let label = dropdown.value;

        if (label === 'Parts' || label === 'Labour') {
            const desc = descInput.value.trim();
            if (desc !== '') {
                label = `${label} (${desc})`;
            }
        }

        if (label.length > MAX_LABEL) {
            label = label.substring(0, MAX_LABEL);
        }

        items.push({ label, amount });
        subtotal += amount;
    });

    if (items.length === 0) {
        alert('Please enter at least one line with an amount.');
        return;
    }

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    function moneyMono(num) {
        const normal = num.toFixed(2);
        return monoNum(normal);
    }

    let bodyLines = [];

    // Header
    bodyLines.push("ORIGINAL PC DOCTOR");
    bodyLines.push("Onsite Servicing Brisbane and Surrounds".padEnd(61, " ") + "ABN: 63159610829");
    bodyLines.push("Phone: 34 222 007      Mobile: 0403 168 740      email: ian@pcdoc.net.au");
    bodyLines.push("");

    // Invoice + Date
    const dateStr = "Date: " + monoNum(formatDate(new Date()));
    const invoiceStr = "Tax Invoice " + invoiceNumber;
    const invoiceLine = invoiceStr + PAD.repeat(COL_WIDTH - invoiceStr.length - dateStr.length) + dateStr;
    bodyLines.push(invoiceLine);
    bodyLines.push("");

    // Items
    items.forEach(item => {
        const amtMono = "＄" + moneyMono(item.amount);
        const label = item.label;

        const line = label + PAD.repeat(COL_WIDTH - label.length - amtMono.length) + amtMono;
        bodyLines.push(line);
    });

    bodyLines.push("");

    // Totals
    const subMono = "＄" + moneyMono(subtotal);
    bodyLines.push("Subtotal:" + PAD.repeat(COL_WIDTH - "Subtotal:".length - subMono.length) + subMono);

    const gstMono = "＄" + moneyMono(gst);
    bodyLines.push("GST (10%):" + PAD.repeat(COL_WIDTH - "GST (10%):".length - gstMono.length) + gstMono);

    const totalMono = "＄" + moneyMono(total);
    bodyLines.push("Total Including GST:" + PAD.repeat(COL_WIDTH - "Total Including GST:".length - totalMono.length) + totalMono);

    bodyLines.push("");
    bodyLines.push("Thank you,");
    bodyLines.push("Ian");

    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber}`);
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}
