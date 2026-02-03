const DESCRIPTION_OPTIONS = [
    'Onsite Service Call',
    'Parts',
    'Labour',
    'Travel',
    'Other'
];

let clients = [];

document.addEventListener('DOMContentLoaded', () => {
    setupDescriptionDropdowns();
    setupAmountListeners();

    document.getElementById('csvInput').addEventListener('change', handleCsvUpload);
    document.getElementById('clientSelect').addEventListener('change', updateInvoiceHeader);
    document.getElementById('sendBtn').addEventListener('click', sendInvoice);
});

function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
        const text = e.target.result;
        clients = parseCsv(text);
        populateClientSelect(clients);
    };
    reader.readAsText(file);
}

function parseCsv(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const parts = line.split(',');
            return {
                name: parts[0].trim(),
                email: (parts[1] || '').trim()
            };
        });
}

function populateClientSelect(clients) {
    const sel = document.getElementById('clientSelect');
    sel.innerHTML = '<option value="">Select client...</option>';
    clients.forEach((c, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = c.name;
        sel.appendChild(opt);
    });
}

function setupDescriptionDropdowns() {
    const rows = document.querySelectorAll('.invoice-row');

    rows.forEach(row => {
        const dropdown = row.querySelector('.descSelect');
        const descInput = row.querySelector('.descInput');

        DESCRIPTION_OPTIONS.forEach(optText => {
            const opt = document.createElement('option');
            opt.value = optText;
            opt.textContent = optText;
            dropdown.appendChild(opt);
        });

        dropdown.addEventListener('change', () => {
            if (dropdown.value === 'Parts' || dropdown.value === 'Labour') {
                dropdown.classList.add('hidden');
                descInput.classList.remove('hidden');
                descInput.placeholder = dropdown.value === 'Parts'
                    ? 'Enter part description'
                    : 'Enter labour description';
            } else {
                dropdown.classList.remove('hidden');
                descInput.classList.add('hidden');
                descInput.value = '';
            }
        });
    });
}

function setupAmountListeners() {
    const amountInputs = document.querySelectorAll('input.amount');
    amountInputs.forEach(inp => {
        inp.addEventListener('input', updateTotals);
    });
}

function updateTotals() {
    const amountInputs = document.querySelectorAll('input.amount');
    let subtotal = 0;
    amountInputs.forEach(inp => {
        const val = parseFloat(inp.value);
        if (!isNaN(val)) subtotal += val;
    });

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    document.getElementById('subtotalDisplay').textContent = formatMoney(subtotal);
    document.getElementById('gstDisplay').textContent = formatMoney(gst);
    document.getElementById('totalDisplay').textContent = formatMoney(total);
}

function formatMoney(num) {
    return '$' + num.toFixed(2);
}

function formatDate(d) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function updateInvoiceHeader() {
    const clientSelect = document.getElementById('clientSelect');
    const index = clientSelect.value;

    const numberDisplay = document.getElementById('invoiceNumberDisplay');
    const dateDisplay = document.getElementById('invoiceDateDisplay');

    if (index === '') {
        numberDisplay.textContent = '';
        dateDisplay.textContent = '';
        return;
    }

    const client = clients[index];
    const invoiceNumber = generateInvoiceNumber(client.name);

    numberDisplay.textContent = `Tax Invoice: ${invoiceNumber}`;
    dateDisplay.textContent = `Date: ${formatDate(new Date())}`;
}

function generateInvoiceNumber(fullName) {
    const parts = fullName.trim().split(' ');
    const last = parts[parts.length - 1];
    const first = parts[0];

    const lastInitial = last.charAt(0).toUpperCase();
    const firstInitial = first.charAt(0).toUpperCase();

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    return `${lastInitial}${firstInitial}${yy}${mm}${dd}`;
}

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

    let lines = [];
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

        lines.push(`${label}: ${formatMoney(amount)}`);
        subtotal += amount;
    });

    if (lines.length === 0) {
        alert('Please enter at least one line with an amount.');
        return;
    }

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    let bodyLines = [];

    // Business header (email only)
    bodyLines.push('ORIGINAL PC DOCTOR');
    bodyLines.push('Onsite Servicing Brisbane and Surrounds        ABN: 63159610829');
    bodyLines.push('Phone: 34 222 007    Mobile: 0403 168 740    email: ian@pcdoc.net.au');
    bodyLines.push('');

    // Invoice + Date on same line
    const dateStr = `Date: ${formatDate(new Date())}`;
    const invoiceStr = `Tax Invoice ${invoiceNumber}`;
    const combinedLine = invoiceStr.padEnd(60, ' ') + dateStr;

    bodyLines.push(combinedLine);
    bodyLines.push('');

    lines.forEach(l => bodyLines.push(l));
    bodyLines.push('');
    bodyLines.push(`Subtotal: ${formatMoney(subtotal)}`);
    bodyLines.push(`GST (10%): ${formatMoney(gst)}`);
    bodyLines.push(`Total Including GST: ${formatMoney(total)}`);
    bodyLines.push('');
    bodyLines.push('Thank you,');
    bodyLines.push('Ian');

    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber}`);
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}
