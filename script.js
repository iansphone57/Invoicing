function sendInvoice() {
    // Monospace digits (Mathematical Monospace)
    const monoDigits = {
        "0": "𝟶", "1": "𝟷", "2": "𝟸", "3": "𝟹", "4": "𝟺",
        "5": "𝟻", "6": "𝟼", "7": "𝟽", "8": "𝟾", "9": "𝟿",
        ".": "․", // DOT LEADER (monospace‑safe)
        "$": "＄" // Fullwidth dollar sign (fixed width)
    };

    // Convert normal number string → monospace number string
    function monoNum(str) {
        return str.split("").map(ch => monoDigits[ch] || ch).join("");
    }

    const PAD = "\u2008"; // punctuation space (fixed width in Outlook Mobile)
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

    function rightAlignMono(str) {
        const needed = COL_WIDTH - str.length;
        return PAD.repeat(needed) + str;
    }

    function moneyMono(num) {
        const normal = num.toFixed(2);
        return monoNum(normal);
    }

    let bodyLines = [];

    // Header (unchanged)
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
