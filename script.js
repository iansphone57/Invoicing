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
    const descSelects = document.querySelectorAll('select.desc');
    descSelects.forEach(sel => {
        DESCRIPTION_OPTIONS.forEach(optText => {
            const opt = document.createElement('option');
            opt.value = optText;
            opt.textContent = optText;
            sel.appendChild(opt);
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

function sendInvoice() {
    const clientSelect = document.getElementById('clientSelect');
    const clientIndex = clientSelect.value;

    if (clientIndex === '') {
        alert('Please select a client.');
        return;
    }

    const client = clients[clientIndex];

    const descSelects = document.querySelectorAll('select.desc');
    const amountInputs = document.querySelectorAll('input.amount');

    let lines = [];
    let subtotal = 0;

    for (let i = 0; i < descSelects.length; i++) {
        const desc = descSelects[i].value.trim();
        const val = parseFloat(amountInputs[i].value);
        if (desc !== '' && !isNaN(val) && val > 0) {
            lines.push(`${desc}: ${formatMoney(val)}`);
            subtotal += val;
        }
    }

    if (lines.length === 0) {
        alert('Please enter at least one line with an amount.');
        return;
    }

    const gst = subtotal * 0.10;
    const total = subtotal + gst;

    let bodyLines = [];
    bodyLines.push(`Hello ${client.name},`);
    bodyLines.push('');
    bodyLines.push('Here is your invoice:');
    bodyLines.push('');

    lines.forEach(l => bodyLines.push(l));
    bodyLines.push('');
    bodyLines.push(`Subtotal: ${formatMoney(subtotal)}`);
    bodyLines.push(`GST (10%): ${formatMoney(gst)}`);
    bodyLines.push(`Total Including GST: ${formatMoney(total)}`);
    bodyLines.push('');
    bodyLines.push('Thank you,');
    bodyLines.push('Ian');

    const subject = encodeURIComponent('Invoice');
    const body = encodeURIComponent(bodyLines.join('\n'));

    window.location.href = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${body}`;
}
