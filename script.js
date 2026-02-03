function sendInvoice() {
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

        items.push({ label, amount });
        subtotal += amount;
    });

    if (items.length === 0) {
        alert('Please enter at least one line with an amount.');
        return;
    }

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    // Start building email body
    let bodyLines = [];

    // Headhunter header (if installed)
    bodyLines.push('ORIGINAL PC DOCTOR');

    // ABN aligned to column 80
    const abnLine = 'Onsite Servicing Brisbane and Surrounds'.padEnd(61, ' ') + 'ABN: 63159610829';
    bodyLines.push(abnLine);

    // Extra spaces before Mobile and email
    const contactLine =
        'Phone: 34 222 007' +
        '      ' + // 6 spaces before Mobile
        'Mobile: 0403 168 740' +
        '      ' + // 6 spaces before email
        'email: ian@pcdoc.net.au';
    bodyLines.push(contactLine);

    bodyLines.push('');

    // Tax Invoice + Date aligned to column 80
    const dateStr = `Date: ${formatDate(new Date())}`;
    const invoiceStr = `Tax Invoice ${invoiceNumber}`;
    const invoiceLine = invoiceStr.padEnd(80 - dateStr.length, ' ') + dateStr;
    bodyLines.push(invoiceLine);

    bodyLines.push('');

    // Line items aligned to column 80
    items.forEach(item => {
        const label = item.label;
        const amount = formatMoney(item.amount);
        const line = label.padEnd(80 - amount.length, ' ') + amount;
        bodyLines.push(line);
    });

    bodyLines.push('');

    // Totals aligned
    const subtotalStr = formatMoney(subtotal);
    bodyLines.push('Subtotal:'.padEnd(80 - subtotalStr.length, ' ') + subtotalStr);

    const gstStr = formatMoney(gst);
    bodyLines.push('GST (10%):'.padEnd(80 - gstStr.length, ' ') + gstStr);

    const totalStr = formatMoney(total);
    bodyLines.push('Total Including GST:'.padEnd(80 - totalStr.length, ' ') + totalStr);

    bodyLines.push('');
    bodyLines.push('Thank you,');
    bodyLines.push('Ian');

    // Force Courier New for Outlook (best alignment)
    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber}`);
    const body = encodeURIComponent(
        '<pre style="font-family: Courier New; font-size: 14px;">\n' +
        bodyLines.join('\n') +
        '\n</pre>'
    );

    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}
