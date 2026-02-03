// v1.00 – PDF-based invoicing

let clients = [];

// CSV upload
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

// Invoice number
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

// Date
function formatDate(date) {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// Main: generate PDF and open email
async function generatePdfAndEmail() {
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

    // Build PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 15;

    // Header – ORIGINAL PC DOCTOR in Headhunter (simulated by font + style)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ORIGINAL PC DOCTOR', 10, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Onsite Servicing Brisbane and Surrounds                 ABN: 63159610829', 10, y);
    y += 6;
    doc.text('Phone: 34 222 007      Mobile: 0403 168 740      email: ian@pcdoc.net.au', 10, y);
    y += 10;

    // Invoice + date + client
    const todayStr = formatDate(new Date());

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Tax Invoice ${invoiceNumber}`, 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${todayStr}`, 150, y, { align: 'right' });
    y += 8;

    doc.text(`Bill To: ${client.name}`, 10, y);
    y += 6;
    doc.text(`${client.email}`, 10, y);
    y += 10;

    // Items table
    const body = items.map(item => [
        item.label,
        item.amount.toFixed(2)
    ]);

    doc.autoTable({
        startY: y,
        head: [['Description', 'Amount (AUD)']],
        body,
        styles: { font: 'helvetica', fontSize: 11 },
        headStyles: { fillColor: [230, 230, 230] },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 40, halign: 'right' }
        }
    });

    const finalY = doc.lastAutoTable.finalY + 8;

    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', 130, finalY, { align: 'right' });
    doc.text(subtotal.toFixed(2), 190, finalY, { align: 'right' });

    doc.text('GST (10%):', 130, finalY + 6, { align: 'right' });
    doc.text(gst.toFixed(2), 190, finalY + 6, { align: 'right' });

    doc.text('Total Including GST:', 130, finalY + 12, { align: 'right' });
    doc.text(total.toFixed(2), 190, finalY + 12, { align: 'right' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text('Thank you,', 10, finalY + 24);
    doc.text('Ian', 10, finalY + 30);

    const fileName = `Tax_Invoice_${invoiceNumber}.pdf`;
    doc.save(fileName);

    // Open email (user manually attaches PDF)
    const subject = encodeURIComponent(`Tax Invoice ${invoiceNumber}`);
    const bodyText = [
        `Hi ${client.name},`,
        '',
        'Please find attached your tax invoice.',
        '',
        'Regards,',
        'Ian'
    ].join('\n');

    const mailto = `mailto:${encodeURIComponent(client.email)}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailto;
}
