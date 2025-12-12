// Global State
let transactions = [];
let settings = {
    namaMadrasah: 'MAN 2 TIDORE KEPULAUAN',
    kelurahan: 'MAREKU',
    kota: 'TIDORE KEPULAUAN',
    provinsi: 'MALUKU UTARA',
    kepalaName: 'Nurlaila Usman, SPd',
    kepalaNIP: 'NIP. 198508021376032001',
    bendaharaName: 'Sarbanan Saruk SPd',
    bendaharaNIP: 'NIP. 196908061089112003',
    location: 'Tidore',
    previousPeriod: 0,
    cashTunai: 0,
    cashBank: 0
};

// Month names in Indonesian
const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Initialize app
document.addEventListener('DOMContentLoaded', function () {
    loadFromLocalStorage();
    renderTransactions();
    updateSummary();
    updateHeaderDisplay();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Transaction Modal
    const transactionModal = document.getElementById('transactionModal');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const transactionForm = document.getElementById('transactionForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeBtns = document.getElementsByClassName('close');

    addTransactionBtn.addEventListener('click', () => openTransactionModal());
    cancelBtn.addEventListener('click', () => closeModal(transactionModal));
    transactionForm.addEventListener('submit', handleTransactionSubmit);

    // Settings Modal
    const settingsModal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');

    settingsBtn.addEventListener('click', () => openSettingsModal());
    cancelSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
    settingsForm.addEventListener('submit', handleSettingsSubmit);

    // Close buttons
    Array.from(closeBtns).forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Print button
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Period selectors
    document.getElementById('monthSelect').addEventListener('change', updateSummary);
    document.getElementById('yearInput').addEventListener('change', updateSummary);

    // Change Password Logic
    const cpModal = document.getElementById('changePasswordModal');
    const cpBtn = document.getElementById('changePasswordBtn');
    const cpForm = document.getElementById('changePasswordForm');
    const cpCancel = document.getElementById('cancelChangePasswordBtn');

    if (cpBtn) {
        cpBtn.addEventListener('click', () => {
            cpForm.reset();
            cpModal.style.display = 'block';
        });
    }

    if (cpCancel) {
        cpCancel.addEventListener('click', () => {
            cpModal.style.display = 'none';
        });
    }

    if (cpForm) {
        cpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldPass = document.getElementById('oldPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirmPass = document.getElementById('confirmPassword').value;

            if (newPass !== confirmPass) {
                alert('Konfirmasi password tidak cocok!');
                return;
            }

            const result = auth.changePassword(oldPass, newPass);
            alert(result.message);

            if (result.success) {
                cpModal.style.display = 'none';
            }
        });
    }
    // Recap Modal
    const recapBtn = document.getElementById('recapBtn');
    if (recapBtn) {
        recapBtn.addEventListener('click', () => openRecapModal());
    }
}

// Recap Functions
function openRecapModal() {
    const modal = document.getElementById('recapModal');
    const tbody = document.getElementById('recapBody');
    const tfoot = document.getElementById('recapFoot');
    const yearDisplay = document.getElementById('recapYearDisplay');
    const printYear = document.getElementById('printYear');
    const printMadrasah = document.getElementById('printMadrasahName');

    // Get year from main input or default to current year
    const yearInput = document.getElementById('yearInput');
    const selectedYear = parseInt(yearInput.value) || new Date().getFullYear();

    yearDisplay.textContent = selectedYear;
    printYear.textContent = selectedYear;
    printMadrasah.textContent = settings.namaMadrasah;

    // Populate Signature
    document.getElementById('recapKepalaName').textContent = settings.kepalaName;
    document.getElementById('recapKepalaNIP').textContent = settings.kepalaNIP;
    document.getElementById('recapBendaharaName').textContent = settings.bendaharaName;
    document.getElementById('recapBendaharaNIP').textContent = settings.bendaharaNIP;
    document.getElementById('recapSignatureLocation').textContent = settings.location;
    // Set date to December 31st of selected year or current date? 
    // Usually annual recap is signed at the end of the year or today if viewed. 
    // Let's use 31 Desember [Year] for now as it's an Annual Recap.
    document.getElementById('recapSignatureDate').textContent = `31 Desember ${selectedYear}`;

    tbody.innerHTML = '';

    // Calculate Monthly Data
    // Logic: Start from settings.previousPeriod as the 'Zero' point (Before Jan)
    // Then accumulate month by month.

    let runningBalance = settings.previousPeriod;
    let totalYearPenerimaan = 0;
    let totalYearPengeluaran = 0;

    // Filter transactions for this year
    const yearTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === selectedYear;
    });

    for (let month = 1; month <= 12; month++) {
        // Find transactions for this month
        const monthlyTrans = yearTransactions.filter(t => {
            const d = new Date(t.date);
            return (d.getMonth() + 1) === month;
        });

        const monthPenerimaan = monthlyTrans.reduce((sum, t) => sum + t.penerimaan, 0);
        const monthPengeluaran = monthlyTrans.reduce((sum, t) => sum + t.pengeluaran, 0);

        runningBalance = runningBalance + monthPenerimaan - monthPengeluaran;

        totalYearPenerimaan += monthPenerimaan;
        totalYearPengeluaran += monthPengeluaran;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${month}</td>
            <td class="month-col">${monthNames[month - 1]}</td>
            <td>${formatCurrency(monthPenerimaan)}</td>
            <td>${formatCurrency(monthPengeluaran)}</td>
            <td>${formatCurrency(runningBalance)}</td>
        `;
        tbody.appendChild(tr);
    }

    // Footer Totals
    tfoot.innerHTML = `
        <tr>
            <td colspan="2" style="text-align: center;">TOTAL</td>
            <td>${formatCurrency(totalYearPenerimaan)}</td>
            <td>${formatCurrency(totalYearPengeluaran)}</td>
            <td>${formatCurrency(runningBalance)}</td>
        </tr>
    `;

    modal.style.display = 'block';
}

function printRecap() {
    window.print();
}

window.printRecap = printRecap;

// Transaction Modal Functions
function openTransactionModal(transaction = null) {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const title = document.getElementById('modalTitle');

    form.reset();

    if (transaction) {
        title.textContent = 'Edit Transaksi';
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('noBukti').value = transaction.noBukti || '';
        document.getElementById('uraian').value = transaction.uraian;
        document.getElementById('kodeRekening').value = transaction.kodeRekening || '';
        document.getElementById('penerimaan').value = transaction.penerimaan || '';
        document.getElementById('pengeluaran').value = transaction.pengeluaran || '';
    } else {
        title.textContent = 'Tambah Transaksi';
        document.getElementById('transactionId').value = '';
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transactionDate').value = today;
    }

    modal.style.display = 'block';
}

function handleTransactionSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('transactionId').value;
    const transaction = {
        id: id || Date.now().toString(),
        date: document.getElementById('transactionDate').value,
        noBukti: document.getElementById('noBukti').value,
        uraian: document.getElementById('uraian').value,
        kodeRekening: document.getElementById('kodeRekening').value,
        penerimaan: parseFloat(document.getElementById('penerimaan').value) || 0,
        pengeluaran: parseFloat(document.getElementById('pengeluaran').value) || 0
    };

    if (id) {
        // Update existing transaction
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = transaction;
        }
    } else {
        // Add new transaction
        transactions.push(transaction);
    }

    // Sort transactions by date
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    saveToLocalStorage();
    renderTransactions();
    updateSummary();
    closeModal(document.getElementById('transactionModal'));
}



// Settings Modal Functions
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');

    // Populate form with current settings
    document.getElementById('settingNamaMadrasah').value = settings.namaMadrasah;
    document.getElementById('settingKelurahan').value = settings.kelurahan;
    document.getElementById('settingKota').value = settings.kota;
    document.getElementById('settingProvinsi').value = settings.provinsi;
    document.getElementById('settingKepalaName').value = settings.kepalaName;
    document.getElementById('settingKepalaNIP').value = settings.kepalaNIP;
    document.getElementById('settingBendaharaName').value = settings.bendaharaName;
    document.getElementById('settingBendaharaNIP').value = settings.bendaharaNIP;
    document.getElementById('settingLocation').value = settings.location;
    document.getElementById('settingPreviousPeriod').value = settings.previousPeriod;
    document.getElementById('settingCashTunai').value = settings.cashTunai;
    document.getElementById('settingCashBank').value = settings.cashBank;

    modal.style.display = 'block';
}

function handleSettingsSubmit(e) {
    e.preventDefault();

    // Read other settings first
    const newSettings = {
        namaMadrasah: document.getElementById('settingNamaMadrasah').value,
        kelurahan: document.getElementById('settingKelurahan').value,
        kota: document.getElementById('settingKota').value,
        provinsi: document.getElementById('settingProvinsi').value,
        kepalaName: document.getElementById('settingKepalaName').value,
        kepalaNIP: document.getElementById('settingKepalaNIP').value,
        bendaharaName: document.getElementById('settingBendaharaName').value,
        bendaharaNIP: document.getElementById('settingBendaharaNIP').value,
        location: document.getElementById('settingLocation').value,
        previousPeriod: parseFloat(document.getElementById('settingPreviousPeriod').value) || 0,
        cashTunai: parseFloat(document.getElementById('settingCashTunai').value) || 0,
        cashBank: parseFloat(document.getElementById('settingCashBank').value) || 0,
        logo: settings.logo // Preserve existing logo by default
    };

    // Handle File Upload
    const logoInput = document.getElementById('settingLogo');
    if (logoInput.files && logoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            newSettings.logo = e.target.result; // Base64 string
            settings = newSettings;
            saveToLocalStorage();
            updateHeaderDisplay();
            updateSummary();
            closeModal(document.getElementById('settingsModal'));
        };
        reader.readAsDataURL(logoInput.files[0]);
    } else {
        settings = newSettings;
        saveToLocalStorage();
        updateHeaderDisplay();
        updateSummary();
        closeModal(document.getElementById('settingsModal'));
    }
}

// Modal Helper
function closeModal(modal) {
    modal.style.display = 'none';
}

// Render Functions
// Global function to handle actions via delegation
function handleTransactionAction(e) {
    const btn = e.target.closest('.btn-action');
    if (!btn) return;

    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    console.log('Action triggered:', action, id);

    if (action === 'edit') {
        const transaction = transactions.find(t => t.id == id);
        if (transaction) {
            openTransactionModal(transaction);
        }
    } else if (action === 'delete') {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            const initialLength = transactions.length;
            transactions = transactions.filter(t => t.id != id); // Loose equality

            if (transactions.length < initialLength) {
                console.log('Transaction deleted successfully');
                saveToLocalStorage();
                renderTransactions();
                updateSummary();
            } else {
                console.error('Failed to delete transaction:', id);
                alert('Gagal menghapus data. ID tidak ditemukan.');
            }
        }
    }
}

function renderTransactions() {
    const tbody = document.getElementById('transactionBody');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 40px; color: #718096; font-style: italic;">
                    Belum ada transaksi. Klik "Tambah Transaksi" untuk memulai.
                </td>
            </tr>
        `;
        return;
    }

    let runningBalance = settings.previousPeriod;

    transactions.forEach((transaction, index) => {
        runningBalance += transaction.penerimaan - transaction.pengeluaran;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.noBukti || '-'}</td>
            <td style="text-align: left;">${transaction.uraian}</td>
            <td>${transaction.kodeRekening || '-'}</td>
            <td>${formatCurrency(transaction.penerimaan)}</td>
            <td>${formatCurrency(transaction.pengeluaran)}</td>
            <td>${formatCurrency(runningBalance)}</td>
            <td class="no-print">
                <div class="action-cell">
                    <button type="button" class="btn btn-edit" onclick="editTransaction('${transaction.id}')">✏️ Edit</button>
                    <button type="button" class="btn btn-danger" onclick="deleteTransaction('${transaction.id}')">🗑️ Hapus</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateSummary() {
    // ... (existing updateSummary code)
    const monthSelect = document.getElementById('monthSelect');
    const yearInput = document.getElementById('yearInput');
    const selectedMonth = parseInt(monthSelect.value);
    const selectedYear = parseInt(yearInput.value);

    // Update month display
    document.getElementById('summaryMonth').textContent = monthNames[selectedMonth - 1];

    // Calculate totals for current period
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    transactions.forEach(transaction => {
        const transDate = new Date(transaction.date);
        const transMonth = transDate.getMonth() + 1;
        const transYear = transDate.getFullYear();

        if (transMonth === selectedMonth && transYear === selectedYear) {
            totalPenerimaan += transaction.penerimaan;
            totalPengeluaran += transaction.pengeluaran;
        }
    });

    const currentPeriodTotal = totalPenerimaan - totalPengeluaran;
    const monthCash = settings.previousPeriod + currentPeriodTotal;
    const totalCash = settings.cashTunai + settings.cashBank;

    // Update display
    document.getElementById('previousPeriod').textContent = formatCurrency(settings.previousPeriod);
    document.getElementById('currentPeriod').textContent = formatCurrency(currentPeriodTotal);
    document.getElementById('monthCash').textContent = formatCurrency(monthCash);
    document.getElementById('totalCash').textContent = formatCurrency(totalCash);
    document.getElementById('cashTunai').textContent = formatCurrency(settings.cashTunai);
    document.getElementById('cashBank').textContent = formatCurrency(settings.cashBank);

    // Update terbilang
    const textTerbilang = terbilang(totalCash).trim();
    document.getElementById('terbilangText').textContent = `(${textTerbilang} Rupiah)`;

    // Update signature date
    const monthName = monthNames[selectedMonth - 1];
    const today = new Date();
    document.getElementById('signatureDate').textContent = `${today.getDate()} ${monthName} ${selectedYear}`;
}

// ... (keep terbilang and updateHeaderDisplay)

// Helper Functions
function editTransaction(id) {
    console.log('Editing transaction:', id);
    const transaction = transactions.find(t => t.id == id); // Loose equality
    if (transaction) {
        openTransactionModal(transaction);
    } else {
        console.error('Transaction not found for edit:', id);
    }
}

function deleteTransaction(id) {
    console.log('Deleting transaction:', id);
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id != id); // Loose equality

        if (transactions.length === initialLength) {
            console.error('Delete failed: Transaction ID not found', id);
            alert('Gagal menghapus: Transaksi tidak ditemukan');
        } else {
            console.log('Transaction deleted successfully');
            saveToLocalStorage();
            renderTransactions();
            updateSummary();
        }
    }
}

// ... (keep format functions)

// LocalStorage functions ...

// Make functions globally accessible for inline onclick handlers
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;

function terbilang(nilai) {
    nilai = Math.floor(Math.abs(nilai));
    const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    let temp = "";

    if (nilai < 12) {
        temp = " " + huruf[nilai];
    } else if (nilai < 20) {
        temp = terbilang(nilai - 10) + " Belas";
    } else if (nilai < 100) {
        temp = terbilang(Math.floor(nilai / 10)) + " Puluh" + terbilang(nilai % 10);
    } else if (nilai < 200) {
        temp = " Seratus" + terbilang(nilai - 100);
    } else if (nilai < 1000) {
        temp = terbilang(Math.floor(nilai / 100)) + " Ratus" + terbilang(nilai % 100);
    } else if (nilai < 2000) {
        temp = " Seribu" + terbilang(nilai - 1000);
    } else if (nilai < 1000000) {
        temp = terbilang(Math.floor(nilai / 1000)) + " Ribu" + terbilang(nilai % 1000);
    } else if (nilai < 1000000000) {
        temp = terbilang(Math.floor(nilai / 1000000)) + " Juta" + terbilang(nilai % 1000000);
    } else if (nilai < 1000000000000) {
        temp = terbilang(Math.floor(nilai / 1000000000)) + " Milyar" + terbilang(nilai % 1000000000);
    }

    return temp;
}

function updateHeaderDisplay() {
    // Update text fields
    document.getElementById('namaMadrasah').textContent = settings.namaMadrasah;
    document.getElementById('kelurahan').textContent = settings.kelurahan;
    document.getElementById('kota').textContent = settings.kota;
    document.getElementById('provinsi').textContent = settings.provinsi;
    document.getElementById('kepalaName').textContent = settings.kepalaName;
    document.getElementById('kepalaNIP').textContent = settings.kepalaNIP;
    document.getElementById('bendaharaName').textContent = settings.bendaharaName;
    document.getElementById('bendaharaNIP').textContent = settings.bendaharaNIP;
    document.getElementById('signatureLocation').textContent = settings.location;

    // Update Logo
    // Update Logo
    const logoImg = document.getElementById('logoDisplay');
    if (logoImg) {
        if (settings.logo) {
            logoImg.src = settings.logo;
            logoImg.style.display = 'block';
        } else {
            logoImg.style.display = 'none';
            logoImg.src = '';
        }
    }
}

// Helper Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function formatCurrency(amount) {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
}

// LocalStorage Functions
function saveToLocalStorage() {
    localStorage.setItem('bkuTransactions', JSON.stringify(transactions));
    localStorage.setItem('bkuSettings', JSON.stringify(settings));
}

function loadFromLocalStorage() {
    const savedTransactions = localStorage.getItem('bkuTransactions');
    const savedSettings = localStorage.getItem('bkuSettings');

    if (savedTransactions) {
        try {
            transactions = JSON.parse(savedTransactions);
        } catch (e) {
            console.error('Error loading transactions:', e);
            transactions = [];
        }
    }

    if (savedSettings) {
        try {
            settings = { ...settings, ...JSON.parse(savedSettings) };
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }
}
