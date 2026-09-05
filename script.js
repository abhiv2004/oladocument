// Helper: Format JS Date object to "04 Sep, 2026"
function formatDateObjToOlaStyle(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "04 Sep, 2026";
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day} ${month}, ${year}`;
}

// Helper: Format YYYY-MM-DD to "04 Sep, 2026"
function formatDateToOlaStyle(dateString) {
    if (!dateString) return "04 Sep, 2026";
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(date.getTime())) return dateString;
    return formatDateObjToOlaStyle(date);
}

// Helper: Format YYYY-MM-DD to "04/09/2026"
function formatDateToSlashStyle(dateString) {
    if (!dateString) return "04/09/2026";
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const day = String(parts[2]).padStart(2, '0');
    const month = String(parts[1]).padStart(2, '0');
    const year = parts[0];
    return `${day}/${month}/${year}`;
}

// Helper: Format "09:46" or "21:46" to "09:46 AM" / "09:46 PM"
function formatTimeTo12Hour(timeString) {
    if (!timeString) return "09:46 AM";
    let str = timeString.trim();
    if (str.toUpperCase().includes('AM') || str.toUpperCase().includes('PM')) {
        return str;
    }
    const parts = str.split(':');
    if (parts.length < 2) return str;
    
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return str;
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    
    return `${strHours}:${minutes} ${ampm}`;
}

// Helper: Format distance with 'km' suffix (e.g. "8.1" -> "8.1 km")
function formatKmSuffix(val) {
    if (val === null || val === undefined || val === "") return "8.1 km";
    let str = String(val).trim();
    if (str.toLowerCase().endsWith('km')) {
        return str;
    }
    return str + " km";
}

// Helper: Format duration with 'min' or 'hr min' suffix (e.g. "15" -> "15 min", "75" -> "1 hr 15 min", "120" -> "2 hr")
function formatMinSuffix(val) {
    if (val === null || val === undefined || val === "") return "15 min";
    let str = String(val).trim();
    if (str.toLowerCase().includes('hr') || str.toLowerCase().endsWith('min') || str.toLowerCase().endsWith('mins')) {
        return str;
    }
    
    let totalMins = parseInt(str, 10);
    if (isNaN(totalMins)) return str + " min";
    
    if (totalMins < 60) {
        return totalMins + " min";
    } else {
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        if (mins === 0) {
            return `${hrs} hr`;
        } else {
            return `${hrs} hr ${mins} min`;
        }
    }
}

// State object holding all receipt & invoice data
const receiptState = {
    customerName: "SHARWAN VERMA",
    customerMobile: "+919426996059",
    rideDateRaw: "2026-09-04",
    pickupTimeRaw: "09:46",
    dropTimeRaw: "10:16",
    crn: "CRN11276703197",
    invoiceId: "CIGYJTCWW539349",
    driverName: "PRAKASH INGOLE",
    carName: "Mini - White Tour H2 CNG",
    distanceKm: "8.1 km",
    durationMin: "15 min",
    pickupAddress: "Shubham Complex, Vatan Nagar, Talegaon Dabhade R, Maharashtra 410507, India",
    dropAddress: "Maxtech Sintered Product Pvt Ltd, Mawal, Pune, Maharashtra, 412106, India",
    totalBill: 161.00,
    convenienceFee: 5.93,
    rideFare: 154.97,
    cgst: 0.53,
    sgst: 0.53,
    totalInvoice: 7.01
};

// Helper: Generate Random CRN Number (Prefix CRN + 11 digits)
function generateRandomCRN() {
    let digits = "";
    for (let i = 0; i < 11; i++) {
        digits += Math.floor(Math.random() * 10);
    }
    const crn = "CRN" + digits;
    document.getElementById("input-crn").value = crn;
    updateReceiptField("crn", crn);
}

// Helper: Generate Random Invoice ID (Prefix CIG + 12 alphanumeric)
function generateRandomInvoiceId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 12; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const invoiceId = "CIG" + randomPart;
    document.getElementById("input-invoice-id").value = invoiceId;
    updateReceiptField("invoiceId", invoiceId);
}

// Helper: Recalculate settlement on Total Bill change
function handleTotalBillChange(newTotal) {
    const total = parseFloat(newTotal);
    if (isNaN(total) || total <= 0) return;

    receiptState.totalBill = total;

    // Generate random Convenience Fee between ₹5.00 and ₹7.00
    const fee = parseFloat((Math.random() * 2 + 5).toFixed(2));
    receiptState.convenienceFee = fee;

    // Ride fare = Total Bill - Convenience Fee
    receiptState.rideFare = parseFloat((total - fee).toFixed(2));

    // Calculate CGST (9%) and SGST (9%) on Convenience Fee
    receiptState.cgst = parseFloat((fee * 0.09).toFixed(2));
    receiptState.sgst = parseFloat((fee * 0.09).toFixed(2));
    receiptState.totalInvoice = parseFloat((fee + receiptState.cgst + receiptState.sgst).toFixed(2));

    // Update inputs if available
    const feeInput = document.getElementById("input-convenience-fee");
    if (feeInput) feeInput.value = receiptState.convenienceFee;
    const fareInput = document.getElementById("input-ride-fare");
    if (fareInput) fareInput.value = receiptState.rideFare;

    renderDocumentData();
}

// Smart calculation for Drop Time & Transaction Date (handles midnight/overnight rollover)
function calculateDropTimeAndTransDate() {
    if (!receiptState.rideDateRaw || !receiptState.pickupTimeRaw) return;

    const dateParts = receiptState.rideDateRaw.split('-');
    if (dateParts.length !== 3) return;
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const timeParts = receiptState.pickupTimeRaw.split(':');
    if (timeParts.length < 2) return;
    const hour = parseInt(timeParts[0], 10);
    const min = parseInt(timeParts[1], 10);

    const pickupObj = new Date(year, month, day, hour, min);
    if (isNaN(pickupObj.getTime())) return;

    let durationMins = parseInt(receiptState.durationMin, 10);
    if (isNaN(durationMins)) durationMins = 15;

    // Add duration in milliseconds
    const dropObj = new Date(pickupObj.getTime() + durationMins * 60000);

    const dropHH = String(dropObj.getHours()).padStart(2, '0');
    const dropMM = String(dropObj.getMinutes()).padStart(2, '0');
    
    receiptState.dropTimeRaw = `${dropHH}:${dropMM}`;
    receiptState.computedDropObj = dropObj;

    // Update Drop Time input element if available
    const dropInput = document.getElementById("input-drop-time");
    if (dropInput && document.activeElement !== dropInput) {
        dropInput.value = receiptState.dropTimeRaw;
    }
}

// Handle customer mobile input to enforce non-erasable "+91" prefix
function handleCustomerMobileInput(inputEl) {
    let val = inputEl.value;
    
    if (!val.startsWith("+91")) {
        let digits = val.replace(/\D/g, '');
        if (digits.startsWith("91")) {
            digits = digits.slice(2);
        }
        val = "+91" + digits;
    } else {
        let prefix = "+91";
        let rest = val.slice(3).replace(/\D/g, '');
        if (rest.length > 10) {
            rest = rest.slice(0, 10);
        }
        val = prefix + rest;
    }

    inputEl.value = val;
    updateReceiptField('customerMobile', val);
}

// Prevent deleting or backspacing the "+91" prefix in customer mobile input
function handleCustomerMobileKeyDown(e) {
    const inputEl = e.target;
    if (e.key === 'Backspace' && inputEl.selectionStart <= 3 && inputEl.selectionEnd <= 3) {
        e.preventDefault();
    }
    if (e.key === 'Delete' && inputEl.selectionStart < 3) {
        e.preventDefault();
    }
}

// Update single state field and re-render
function updateReceiptField(key, value) {
    if (key === 'customerName' && typeof value === 'string') {
        value = value.toUpperCase();
        const nameInput = document.getElementById("input-customer-name");
        if (nameInput && nameInput.value !== value) {
            nameInput.value = value;
        }
    }
    receiptState[key] = value;
    renderDocumentData();
}

// Render all state values into DOM
function renderDocumentData() {
    calculateDropTimeAndTransDate();

    const formattedOlaDate = formatDateToOlaStyle(receiptState.rideDateRaw);
    const formattedSlashDate = formatDateToSlashStyle(receiptState.rideDateRaw);
    const formattedPickupTime = formatTimeTo12Hour(receiptState.pickupTimeRaw);
    const formattedDropTime = formatTimeTo12Hour(receiptState.dropTimeRaw);

    // Format transaction date & time based on computed drop date (handles overnight date rollover!)
    const transDateOla = receiptState.computedDropObj ? formatDateObjToOlaStyle(receiptState.computedDropObj) : formattedOlaDate;
    const formattedTransDate = `${transDateOla} ${formattedDropTime}`;

    const formattedKm = formatKmSuffix(receiptState.distanceKm);
    const formattedMin = formatMinSuffix(receiptState.durationMin);

    const upperCustomerName = (receiptState.customerName || "").toUpperCase();

    // 1. Receipt Page Elements
    setText("display-receipt-date", formattedOlaDate);
    setText("display-receipt-amount", "₹" + Math.round(receiptState.totalBill));
    setText("display-receipt-crn", receiptState.crn);
    setText("display-receipt-thanks", "Thanks for travelling with us, " + upperCustomerName);
    setText("display-driver-name", receiptState.driverName);
    setText("display-trip-stats", formattedKm + " \u00A0\u00A0\u00A0 " + formattedMin);
    setText("display-car-name", receiptState.carName);
    setText("display-pickup-time", formattedPickupTime);
    setText("display-drop-time", formattedDropTime);
    setText("display-pickup-address", receiptState.pickupAddress);
    setText("display-drop-address", receiptState.dropAddress);
    setText("display-ride-fare", "₹" + receiptState.rideFare.toFixed(2));
    setText("display-convenience-fee", "₹" + receiptState.convenienceFee.toFixed(2));
    setText("display-total-bill", "₹" + Math.round(receiptState.totalBill));
    setText("display-payment-amount", "₹" + Math.round(receiptState.totalBill));

    // 2. Invoice Page Elements
    setText("display-inv-crn-ref", "Ola Ride Number - " + receiptState.crn);
    setText("display-inv-id", receiptState.invoiceId);
    setText("display-inv-date", formattedSlashDate);
    setText("display-inv-customer", upperCustomerName);
    setText("display-inv-mobile", receiptState.customerMobile);
    setText("display-inv-fee", "₹" + receiptState.convenienceFee.toFixed(2));
    setText("display-inv-cgst", "₹" + receiptState.cgst.toFixed(2));
    setText("display-inv-sgst", "₹" + receiptState.sgst.toFixed(2));
    setText("display-inv-total", "₹" + receiptState.totalInvoice.toFixed(2));
    setText("display-inv-trans-date", formattedTransDate);
    setText("display-inv-paid-amount", "₹" + receiptState.totalInvoice.toFixed(2));
}

// Utility DOM setter helper
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) {
        el.innerText = text;
    }
}

// Tab switcher logic
function switchTab(tabName) {
    const receiptView = document.getElementById('receipt-view');
    const invoiceView = document.getElementById('invoice-view');
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tabName === 'both') {
        if (receiptView) receiptView.style.display = 'block';
        if (invoiceView) invoiceView.style.display = 'block';
        const bothBtn = Array.from(tabBtns).find(btn => btn.getAttribute('onclick')?.includes("'both'"));
        if (bothBtn) bothBtn.classList.add('active');
    } else if (tabName === 'receipt') {
        if (receiptView) receiptView.style.display = 'block';
        if (invoiceView) invoiceView.style.display = 'none';
        const receiptBtn = Array.from(tabBtns).find(btn => btn.getAttribute('onclick')?.includes("'receipt'"));
        if (receiptBtn) receiptBtn.classList.add('active');
    } else if (tabName === 'invoice') {
        if (receiptView) receiptView.style.display = 'none';
        if (invoiceView) invoiceView.style.display = 'block';
        const invoiceBtn = Array.from(tabBtns).find(btn => btn.getAttribute('onclick')?.includes("'invoice'"));
        if (invoiceBtn) invoiceBtn.classList.add('active');
    }
}

// PDF Download Trigger
function downloadPDF(elementOrId, defaultFilename, btnElement) {
    let element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
    if (!element) return;

    const btn = btnElement || (event && event.currentTarget && event.currentTarget.tagName === 'BUTTON' ? event.currentTarget : null);
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '⏳ Generating PDF...';
    }

    const filename = defaultFilename || 'Ola_Document.pdf';

    // Apply strict PDF rendering class to enforce exact 720px desktop card dimensions on mobile & desktop
    document.body.classList.add('pdf-rendering');

    if (typeof html2pdf !== 'undefined') {
        const opt = {
            margin:       [0.2, 0.2, 0.2, 0.2],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, allowTaint: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 800 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            document.body.classList.remove('pdf-rendering');
            if (btn) {
                btn.innerHTML = '✅ Downloaded!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }, 2000);
            }
        }).catch(err => {
            document.body.classList.remove('pdf-rendering');
            console.error('html2pdf generation error, falling back to window.print():', err);
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            window.print();
        });
    } else {
        document.body.classList.remove('pdf-rendering');
        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
        window.print();
    }
}

// Active View PDF Downloader (Handles Single or Multi-Page PDF Download)
function downloadActivePDF(triggerBtn) {
    const receiptView = document.getElementById('receipt-view');
    const invoiceView = document.getElementById('invoice-view');
    const documentContainer = document.getElementById('document-container');
    const btn = triggerBtn || (event && event.currentTarget && event.currentTarget.tagName === 'BUTTON' ? event.currentTarget : document.querySelector('.download-pdf-btn'));

    const crnClean = (receiptState.crn || 'CRN').replace(/[^a-zA-Z0-9]/g, '');
    const invClean = (receiptState.invoiceId || 'INV').replace(/[^a-zA-Z0-9]/g, '');

    const isReceiptVisible = receiptView && receiptView.style.display !== 'none';
    const isInvoiceVisible = invoiceView && invoiceView.style.display !== 'none';

    if (isReceiptVisible && isInvoiceVisible) {
        const filename = `Ola_Ride_Receipt_&_Tax_Invoice_${crnClean}.pdf`;
        const exportTarget = documentContainer || document.body;

        let originalText = '';
        if (btn) {
            originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '⏳ Generating PDF...';
        }

        // Apply strict PDF rendering class to enforce exact 720px desktop card dimensions on mobile & desktop
        document.body.classList.add('pdf-rendering');

        // Temporarily clear margin-bottom on receipt-view so page 1 ends cleanly
        const originalMarginBottom = receiptView.style.marginBottom;
        receiptView.style.marginBottom = '0px';

        const opt = {
            margin:       [0.2, 0.2, 0.2, 0.2],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, allowTaint: true, logging: false, scrollX: 0, scrollY: 0, windowWidth: 800 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        if (typeof html2pdf !== 'undefined') {
            html2pdf().set(opt).from(exportTarget).save().then(() => {
                receiptView.style.marginBottom = originalMarginBottom || '40px';
                document.body.classList.remove('pdf-rendering');
                if (btn) {
                    btn.innerHTML = '✅ Downloaded!';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 2000);
                }
            }).catch(err => {
                receiptView.style.marginBottom = originalMarginBottom || '40px';
                document.body.classList.remove('pdf-rendering');
                console.error('PDF error:', err);
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                window.print();
            });
        } else {
            receiptView.style.marginBottom = originalMarginBottom || '40px';
            document.body.classList.remove('pdf-rendering');
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            window.print();
        }
    } else if (isInvoiceVisible) {
        const filename = `Ola_Tax_Invoice_${invClean}.pdf`;
        downloadPDF('invoice-view', filename, btn);
    } else {
        const filename = `Ola_Ride_Receipt_${crnClean}.pdf`;
        downloadPDF('receipt-view', filename, btn);
    }
}

// Keyboard Shortcut: Ctrl + Shift + D
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.shiftKey && (event.key === 'D' || event.key === 'd')) {
        event.preventDefault();
        downloadActivePDF();
    }
});

// Toggle Generator Panel Visibility
function toggleGeneratorPanel() {
    const panel = document.getElementById('generator-panel');
    const toggleBtn = document.getElementById('toggle-panel-btn');
    if (panel) {
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'block';
            if (toggleBtn) toggleBtn.innerText = '🔼 Hide Generator Form';
        } else {
            panel.style.display = 'none';
            if (toggleBtn) toggleBtn.innerText = '⚙️ Edit Document Details (Form)';
        }
    }
}

// Initialize on DOM load (Default to Both Pages view)
document.addEventListener('DOMContentLoaded', function() {
    switchTab('both');
    renderDocumentData();
});
