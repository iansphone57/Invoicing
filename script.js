function sendInvoice() {
    const FIG = "\u2007"; // U+2007 FIGURE SPACE
    const COL_WIDTH = 80;
    const MAX_LABEL = 50; // Option C

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

    // Helper: pad with FIGURE SPACES
    function padFig(str, totalWidth) {
        const needed = totalWidth - str.length;
        return needed > 0 ? str + FIG.repeat(needed) : str;
    }

    // Helper: right-align to column 80
    function rightAlign(str) {
        const needed = COL_WIDTH - str.length;
        return FIG.repeat(needed) + str;
    }

    // Helper: format money with decimal alignment
    function money(num) {
        return num.toFixed(2); // no $ yet
    }

    let bodyLines = [];

    // Header
    bodyLines.push("ORIGINAL PC DOCTOR");
    bodyLines.push("Onsite Servicing Brisbane and Surrounds".padEnd(61, " ") + "ABN: 63159610829");
    bodyLines.push("Phone: 34 222 007      Mobile: 0403 168 740      email: ian@pcdoc.net.au");
    bodyLines.push("");

    // Invoice + Date
    const dateStr = "Date: " + formatDate(new Date());
    const invoiceStr = "Tax Invoice " + invoiceNumber;
    bodyLines.push(padFig(invoiceStr, COL_WIDTH - dateStr.length) + dateStr);
    bodyLines.push("");

    // Items
    items.forEach(item => {
        const amt = "$" + money(item.amount);
        const label = item.label;

        const line = padFig(label, COL_WIDTH - amt.length) + amt;
        bodyLines.push(line);
    });

    bodyLines.push("");

    // Totals
    const subStr = "$" + money(subtotal);
    bodyLines.push(padFig("Subtotal:", COL_WIDTH - subStr.length) + subStr);

    const gstStr = "$" + money(gst);
    bodyLines.push(padFig("GST (10%):", COL_WIDTH - gstStr.length) + gstStr);

    const totalStr = "$" + money(total);
    bodyLines.push(padFig("Total Including GST:", COL_WIDTH - totalStr.length) + totalStr);

    bodyLines.push("");
    bodyLines.push("Thank you,");
    bodyLines.push("Ian");

    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber}`);
    const body = encodeURIComponent(bodyLines.join("\n"));

    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}
