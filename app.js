/**
 * SalesPulse - Sales Analytics Dashboard
 * Pure Vanilla JavaScript with browser localStorage persistence.
 * Zero external libraries, zero backend dependencies.
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // Storage Keys & Constants
  // -------------------------------------------------------------------------
  const STORAGE_KEYS = {
    TRANSACTIONS: 'salespulse_transactions_v1',
    SETTINGS: 'salespulse_settings_v1'
  };

  const DEFAULT_SETTINGS = {
    monthlyQuota: 120000
  };

  const CATEGORY_COLORS = {
    'Software': '#2563eb',
    'Hardware': '#10b981',
    'Services': '#8b5cf6',
    'Subscriptions': '#f59e0b',
    'Accessories': '#ec4899'
  };

  const PAYMENT_ICONS = {
    'Credit Card': '💳',
    'Wire Transfer': '🏦',
    'Stripe': '⚡',
    'PayPal': '🅿️',
    'Check': '📝'
  };

  // -------------------------------------------------------------------------
  // App State
  // -------------------------------------------------------------------------
  let state = {
    transactions: [],
    settings: { ...DEFAULT_SETTINGS },
    filters: {
      timeRange: 'month',
      category: 'all',
      status: 'all',
      search: ''
    },
    sort: {
      column: 'date',
      direction: 'desc'
    },
    editingId: null
  };

  // -------------------------------------------------------------------------
  // DOM Cache
  // -------------------------------------------------------------------------
  const elements = {
    // Actions & Filter Controls
    openNewSaleBtn: document.getElementById('open-new-sale-btn'),
    openSettingsBtn: document.getElementById('open-settings-btn'),
    timeRangeSelect: document.getElementById('time-range-select'),
    categoryFilterSelect: document.getElementById('category-filter-select'),
    statusFilterSelect: document.getElementById('status-filter-select'),
    quickSeedBtn: document.getElementById('quick-seed-btn'),
    tableSearchInput: document.getElementById('table-search-input'),

    // KPI Metrics
    kpiTotalRevenue: document.getElementById('kpi-total-revenue'),
    kpiTotalOrders: document.getElementById('kpi-total-orders'),
    kpiCompletedRatio: document.getElementById('kpi-completed-ratio'),
    kpiAov: document.getElementById('kpi-aov'),
    targetProgressPercent: document.getElementById('target-progress-percent'),
    targetProgressFill: document.getElementById('target-progress-fill'),
    targetRemainingLabel: document.getElementById('target-remaining-label'),

    // Charts & Insights
    trendChartContainer: document.getElementById('trend-chart-container'),
    revenueTrendSvg: document.getElementById('revenue-trend-svg'),
    chartTooltip: document.getElementById('chart-tooltip'),
    donutSegmentsGroup: document.getElementById('donut-segments-group'),
    donutCenterTotal: document.getElementById('donut-center-total'),
    categoryLegendList: document.getElementById('category-legend-list'),
    topProductsList: document.getElementById('top-products-list'),
    paymentMethodsList: document.getElementById('payment-methods-list'),

    // Transactions Table
    transactionsTableBody: document.getElementById('transactions-table-body'),
    tableCountLabel: document.getElementById('table-count-label'),
    tableHeaderCells: document.querySelectorAll('.data-table th.sortable'),

    // Sale Modal
    saleModal: document.getElementById('sale-modal'),
    modalTitle: document.getElementById('modal-title'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    cancelModalBtn: document.getElementById('cancel-modal-btn'),
    saleForm: document.getElementById('sale-form'),
    saleIdInput: document.getElementById('sale-id-input'),
    customerNameInput: document.getElementById('customer-name-input'),
    productNameInput: document.getElementById('product-name-input'),
    categorySelect: document.getElementById('category-select'),
    amountInput: document.getElementById('amount-input'),
    unitsInput: document.getElementById('units-input'),
    saleDateInput: document.getElementById('sale-date-input'),
    paymentMethodSelect: document.getElementById('payment-method-select'),
    statusSelect: document.getElementById('status-select'),

    // Settings Modal
    settingsModal: document.getElementById('settings-modal'),
    closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
    closeSettingsBtn: document.getElementById('close-settings-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    monthlyTargetInput: document.getElementById('monthly-target-input'),
    exportJsonBtn: document.getElementById('export-json-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    importJsonFile: document.getElementById('import-json-file'),
    reloadSamplesBtn: document.getElementById('reload-samples-btn'),
    clearAllDataBtn: document.getElementById('clear-all-data-btn'),

    // Toast
    toast: document.getElementById('toast')
  };

  // -------------------------------------------------------------------------
  // Sample Data Generator (Realistic Enterprise Sales)
  // -------------------------------------------------------------------------
  function generateSampleData() {
    const today = new Date();
    const transactions = [];

    const sampleCustomers = [
      'Acme Global Tech', 'Apex Solutions', 'Starlight Media', 'Nexus Enterprise',
      'Quantum Logistics', 'CyberShield Inc', 'Vertex Health', 'Horizon Retail',
      'Solaris Dynamics', 'Beacon Systems', 'Cascade Bio', 'Titan Capital'
    ];

    const catalog = [
      { name: 'Enterprise Cloud Suite (Annual)', category: 'Software', basePrice: 4800 },
      { name: 'Pro Developer Seat (Monthly)', category: 'Subscriptions', basePrice: 240 },
      { name: 'Hardware Security Key (10-Pack)', category: 'Hardware', basePrice: 550 },
      { name: 'Cloud Migration & Architecture', category: 'Services', basePrice: 7500 },
      { name: 'AI Analytics Add-On License', category: 'Software', basePrice: 1850 },
      { name: 'Server Rack Mount 2U Ultra', category: 'Hardware', basePrice: 3200 },
      { name: 'Dedicated Support Retainer', category: 'Subscriptions', basePrice: 1200 },
      { name: 'High-Speed Fiber Transceiver', category: 'Accessories', basePrice: 380 },
      { name: 'Custom Security Audit & Pentest', category: 'Services', basePrice: 9200 },
      { name: 'Wireless Ergonomic Sensor Set', category: 'Accessories', basePrice: 190 }
    ];

    const paymentMethods = ['Credit Card', 'Wire Transfer', 'Stripe', 'PayPal', 'Check'];
    const statuses = ['Completed', 'Completed', 'Completed', 'Completed', 'Pending', 'Refunded'];

    // Generate 32 realistic transactions across the last 45 days
    for (let i = 0; i < 32; i++) {
      const daysAgo = Math.floor(Math.random() * 45);
      const saleDate = new Date(today);
      saleDate.setDate(today.getDate() - daysAgo);

      const item = catalog[Math.floor(Math.random() * catalog.length)];
      const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
      const units = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 2 : 1;
      const amount = Math.round(item.basePrice * units * (0.95 + Math.random() * 0.1) * 100) / 100;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const payment = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const dateStr = saleDate.toISOString().split('T')[0];
      const orderId = 'ORD-' + (9200 + i);

      transactions.push({
        id: 'txn_' + (1000 + i),
        orderId: orderId,
        customer: customer,
        product: item.name,
        category: item.category,
        amount: amount,
        units: units,
        date: dateStr,
        payment: payment,
        status: status,
        createdAt: saleDate.getTime()
      });
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  }

  // -------------------------------------------------------------------------
  // LocalStorage Management
  // -------------------------------------------------------------------------
  function loadData() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        state.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      }

      const savedTxns = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (savedTxns) {
        state.transactions = JSON.parse(savedTxns);
      } else {
        // First visit: Seed sample sales data
        state.transactions = generateSampleData();
        saveTransactions();
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      state.transactions = generateSampleData();
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  // -------------------------------------------------------------------------
  // Toast Notifications
  // -------------------------------------------------------------------------
  let toastTimer = null;
  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 2800);
  }

  // -------------------------------------------------------------------------
  // Filter Utilities
  // -------------------------------------------------------------------------
  function getFilteredTransactions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return state.transactions.filter(item => {
      const itemDate = new Date(item.date);

      // Time Range Filter
      if (state.filters.timeRange === 'week') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (state.filters.timeRange === 'month') {
        if (itemDate.getFullYear() !== currentYear || itemDate.getMonth() !== currentMonth) return false;
      } else if (state.filters.timeRange === 'quarter') {
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 90 || diffDays < 0) return false;
      } else if (state.filters.timeRange === 'year') {
        if (itemDate.getFullYear() !== currentYear) return false;
      }

      // Category Filter
      if (state.filters.category !== 'all' && item.category !== state.filters.category) {
        return false;
      }

      // Status Filter
      if (state.filters.status !== 'all' && item.status !== state.filters.status) {
        return false;
      }

      // Search Query
      if (state.filters.search) {
        const q = state.filters.search.toLowerCase();
        const matchesCustomer = item.customer.toLowerCase().includes(q);
        const matchesProduct = item.product.toLowerCase().includes(q);
        const matchesOrderId = item.orderId.toLowerCase().includes(q);
        if (!matchesCustomer && !matchesProduct && !matchesOrderId) return false;
      }

      return true;
    });
  }

  // -------------------------------------------------------------------------
  // Render KPI Metrics
  // -------------------------------------------------------------------------
  function renderKPIs(filteredTxns) {
    // Only completed orders count towards recognized revenue
    const completedTxns = filteredTxns.filter(t => t.status === 'Completed');
    const totalRevenue = completedTxns.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const totalOrders = filteredTxns.length;
    const aov = completedTxns.length > 0 ? (totalRevenue / completedTxns.length) : 0;

    elements.kpiTotalRevenue.textContent = Math.round(totalRevenue).toLocaleString();
    elements.kpiTotalOrders.textContent = totalOrders.toLocaleString();
    elements.kpiCompletedRatio.textContent = `${completedTxns.length} completed (${totalOrders - completedTxns.length} pending/refunded)`;
    elements.kpiAov.textContent = aov.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Target Quota Calculation (based on current month's completed revenue)
    const now = new Date();
    const monthTxns = state.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && t.status === 'Completed';
    });
    const monthRevenue = monthTxns.reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const quota = Number(state.settings.monthlyQuota) || 120000;
    const percent = Math.min(Math.round((monthRevenue / quota) * 100), 100);
    const remaining = Math.max(0, quota - monthRevenue);

    elements.targetProgressPercent.textContent = `${percent}%`;
    elements.targetProgressFill.style.width = `${percent}%`;
    if (remaining > 0) {
      elements.targetRemainingLabel.textContent = `$${Math.round(remaining).toLocaleString()} left to reach quota`;
    } else {
      elements.targetRemainingLabel.textContent = `🎯 Quota exceeded by $${Math.round(monthRevenue - quota).toLocaleString()}!`;
    }
  }

  // -------------------------------------------------------------------------
  // Render Pure Vanilla SVG Revenue Trend Chart
  // -------------------------------------------------------------------------
  function renderTrendChart(filteredTxns) {
    const svg = elements.revenueTrendSvg;
    svg.innerHTML = '';

    // Group completed sales by date
    const dateMap = {};
    filteredTxns.forEach(t => {
      if (t.status === 'Completed') {
        dateMap[t.date] = (dateMap[t.date] || 0) + Number(t.amount);
      }
    });

    const dates = Object.keys(dateMap).sort();

    // If less than 2 data points, show fallback message inside SVG
    if (dates.length < 2) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '350');
      text.setAttribute('y', '120');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#94a3b8');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', '600');
      text.textContent = 'Not enough completed sales data for this period to graph';
      svg.appendChild(text);
      return;
    }

    const dataPoints = dates.map(d => ({ date: d, amount: dateMap[d] }));

    // Chart Dimensions
    const width = 700;
    const height = 240;
    const paddingLeft = 65;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calculate Max Value (round up nicely)
    const maxVal = Math.max(...dataPoints.map(p => p.amount)) * 1.15 || 1000;

    // Defs for area fill gradient
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2563eb" stop-opacity="0.28" />
        <stop offset="100%" stop-color="#2563eb" stop-opacity="0.01" />
      </linearGradient>
    `;
    svg.appendChild(defs);

    // Draw horizontal grid lines & Y-Axis labels (4 divisions)
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = paddingTop + (chartHeight / gridCount) * i;
      const val = Math.round(maxVal - (maxVal / gridCount) * i);

      // Grid line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', paddingLeft);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width - paddingRight);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#f1f5f9');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);

      // Y-axis Label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', paddingLeft - 10);
      label.setAttribute('y', y + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '10');
      label.setAttribute('font-weight', '600');
      label.setAttribute('fill', '#94a3b8');
      label.textContent = '$' + (val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val);
      svg.appendChild(label);
    }

    // Compute coordinate points
    const points = dataPoints.map((pt, idx) => {
      const x = paddingLeft + (idx / (dataPoints.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (pt.amount / maxVal) * chartHeight;
      return { x, y, pt };
    });

    // Build SVG Path strings
    const pathD = points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${paddingTop + chartHeight} L ${points[0].x.toFixed(1)} ${paddingTop + chartHeight} Z`;

    // Area Fill
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', areaD);
    areaPath.setAttribute('fill', 'url(#revenueGradient)');
    svg.appendChild(areaPath);

    // Stroke Line
    const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    strokePath.setAttribute('d', pathD);
    strokePath.setAttribute('fill', 'none');
    strokePath.setAttribute('stroke', '#2563eb');
    strokePath.setAttribute('stroke-width', '2.5');
    strokePath.setAttribute('stroke-linecap', 'round');
    strokePath.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(strokePath);

    // X-Axis date labels & Interactive Circles
    const step = Math.max(1, Math.floor(dataPoints.length / 6));
    points.forEach((p, idx) => {
      // Date label on X axis
      if (idx % step === 0 || idx === points.length - 1) {
        const dateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        dateLabel.setAttribute('x', p.x);
        dateLabel.setAttribute('y', paddingTop + chartHeight + 20);
        dateLabel.setAttribute('text-anchor', 'middle');
        dateLabel.setAttribute('font-size', '10');
        dateLabel.setAttribute('font-weight', '600');
        dateLabel.setAttribute('fill', '#94a3b8');
        const parts = p.pt.date.split('-');
        dateLabel.textContent = `${parts[1]}/${parts[2]}`;
        svg.appendChild(dateLabel);
      }

      // Interactive hover circle point
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', '#ffffff');
      circle.setAttribute('stroke', '#2563eb');
      circle.setAttribute('stroke-width', '2.5');
      circle.style.cursor = 'pointer';
      circle.style.transition = 'r 0.15s ease, stroke-width 0.15s ease';

      circle.addEventListener('mouseenter', (e) => {
        circle.setAttribute('r', '7');
        circle.setAttribute('stroke-width', '3');
        const rect = elements.trendChartContainer.getBoundingClientRect();
        const tooltipX = (p.x / width) * rect.width;
        const tooltipY = (p.y / height) * rect.height;

        elements.chartTooltip.innerHTML = `<strong>${p.pt.date}</strong><br>$${Math.round(p.pt.amount).toLocaleString()} Revenue`;
        elements.chartTooltip.style.left = `${tooltipX}px`;
        elements.chartTooltip.style.top = `${tooltipY}px`;
        elements.chartTooltip.style.display = 'block';
      });

      circle.addEventListener('mouseleave', () => {
        circle.setAttribute('r', '4');
        circle.setAttribute('stroke-width', '2.5');
        elements.chartTooltip.style.display = 'none';
      });

      svg.appendChild(circle);
    });
  }

  // -------------------------------------------------------------------------
  // Render Category Donut Chart
  // -------------------------------------------------------------------------
  function renderCategoryChart(filteredTxns) {
    const group = elements.donutSegmentsGroup;
    group.innerHTML = '';
    elements.categoryLegendList.innerHTML = '';

    const catTotals = {
      'Software': 0,
      'Hardware': 0,
      'Services': 0,
      'Subscriptions': 0,
      'Accessories': 0
    };

    let total = 0;
    filteredTxns.forEach(t => {
      const amt = Number(t.amount || 0);
      if (catTotals[t.category] !== undefined) {
        catTotals[t.category] += amt;
      } else {
        catTotals['Software'] += amt;
      }
      total += amt;
    });

    elements.donutCenterTotal.textContent = '$' + (total >= 1000 ? (total / 1000).toFixed(0) + 'k' : Math.round(total));

    // Circumference for r=65 is 2 * PI * 65 ≈ 408.4
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    Object.keys(catTotals).forEach(cat => {
      const amount = catTotals[cat];
      const percent = total > 0 ? (amount / total) : 0;
      const color = CATEGORY_COLORS[cat] || '#2563eb';

      if (percent > 0) {
        const segmentLength = percent * circumference;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '80');
        circle.setAttribute('cy', '80');
        circle.setAttribute('r', radius.toString());
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', color);
        circle.setAttribute('stroke-width', '18');
        circle.setAttribute('stroke-dasharray', `${segmentLength.toFixed(1)} ${(circumference - segmentLength).toFixed(1)}`);
        circle.setAttribute('stroke-dashoffset', (-accumulatedOffset).toFixed(1));
        group.appendChild(circle);

        accumulatedOffset += segmentLength;
      }

      // Legend Item
      const itemEl = document.createElement('div');
      itemEl.className = 'category-legend-item';
      itemEl.innerHTML = `
        <div class="category-legend-info">
          <span class="cat-color-chip" style="background-color: ${color}"></span>
          <span class="cat-name">${cat}</span>
        </div>
        <div class="category-legend-stats">
          <span class="cat-amount">$${Math.round(amount).toLocaleString()}</span>
          <span class="cat-percent">${Math.round(percent * 100)}%</span>
        </div>
      `;
      elements.categoryLegendList.appendChild(itemEl);
    });
  }

  // -------------------------------------------------------------------------
  // Render Leaderboard & Payment Methods
  // -------------------------------------------------------------------------
  function renderInsights(filteredTxns) {
    // 1. Top Products
    const productTotals = {};
    filteredTxns.forEach(t => {
      productTotals[t.product] = (productTotals[t.product] || 0) + Number(t.amount);
    });

    const sortedProducts = Object.keys(productTotals)
      .map(name => ({ name, total: productTotals[name] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);

    const maxProductVal = sortedProducts.length > 0 ? sortedProducts[0].total : 1;
    elements.topProductsList.innerHTML = '';

    if (sortedProducts.length === 0) {
      elements.topProductsList.innerHTML = '<div class="empty-state-text" style="color:#94a3b8;font-size:13px;padding:12px;">No products sold in this period</div>';
    } else {
      sortedProducts.forEach((prod, index) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-item';
        const pct = Math.round((prod.total / maxProductVal) * 100);
        row.innerHTML = `
          <div class="rank-badge rank-${index + 1}">${index + 1}</div>
          <div class="product-info-wrap">
            <span class="product-title">${prod.name}</span>
            <div class="product-progress-track">
              <div class="product-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          <div class="product-amount">$${Math.round(prod.total).toLocaleString()}</div>
        `;
        elements.topProductsList.appendChild(row);
      });
    }

    // 2. Payment Methods Breakdown
    const paymentTotals = {};
    let totalAll = 0;
    filteredTxns.forEach(t => {
      const amt = Number(t.amount || 0);
      paymentTotals[t.payment] = (paymentTotals[t.payment] || 0) + amt;
      totalAll += amt;
    });

    elements.paymentMethodsList.innerHTML = '';
    const paymentMethods = ['Credit Card', 'Wire Transfer', 'Stripe', 'PayPal', 'Check'];

    paymentMethods.forEach(method => {
      const amt = paymentTotals[method] || 0;
      const pct = totalAll > 0 ? Math.round((amt / totalAll) * 100) : 0;
      const icon = PAYMENT_ICONS[method] || '💳';

      const row = document.createElement('div');
      row.className = 'payment-row';
      row.innerHTML = `
        <div class="payment-meta">
          <span class="payment-name">${icon} ${method}</span>
          <span class="payment-stat">$${Math.round(amt).toLocaleString()} (${pct}%)</span>
        </div>
        <div class="payment-track">
          <div class="payment-fill" style="width: ${pct}%; background-color: #2563eb;"></div>
        </div>
      `;
      elements.paymentMethodsList.appendChild(row);
    });
  }

  // -------------------------------------------------------------------------
  // Render Transactions Table
  // -------------------------------------------------------------------------
  function renderTable(filteredTxns) {
    const tbody = elements.transactionsTableBody;
    tbody.innerHTML = '';

    // Apply Sorting
    const sorted = [...filteredTxns].sort((a, b) => {
      let valA = a[state.sort.column];
      let valB = b[state.sort.column];

      if (state.sort.column === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (state.sort.column === 'date') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return state.sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return state.sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    elements.tableCountLabel.textContent = `Showing ${sorted.length} transactions`;

    if (sorted.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="9" style="text-align:center; padding:32px; color:#94a3b8; font-style:italic;">No transactions match your current search and filter settings.</td>`;
      tbody.appendChild(tr);
      return;
    }

    sorted.forEach(txn => {
      const tr = document.createElement('tr');

      // Status pill class
      const statusClass = txn.status === 'Completed'
        ? 'status-completed'
        : txn.status === 'Pending'
        ? 'status-pending'
        : 'status-refunded';

      // Customer avatar initials
      const initials = txn.customer.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

      tr.innerHTML = `
        <td><span class="order-id-badge">${txn.orderId}</span></td>
        <td>
          <div class="customer-cell">
            <div class="customer-avatar">${initials}</div>
            <span class="customer-name">${txn.customer}</span>
          </div>
        </td>
        <td>${txn.product}</td>
        <td><span class="category-tag">${txn.category}</span></td>
        <td>${txn.date}</td>
        <td>${PAYMENT_ICONS[txn.payment] || '💳'} ${txn.payment}</td>
        <td><span class="status-pill ${statusClass}">${txn.status}</span></td>
        <td class="text-right"><span class="amount-val">$${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td>
        <td class="text-center">
          <div class="action-btns-wrap">
            <button class="row-action-btn edit-btn" title="Edit order" data-id="${txn.id}">✏️</button>
            <button class="row-action-btn del-btn" title="Delete order" data-id="${txn.id}">🗑️</button>
          </div>
        </td>
      `;

      // Event Listeners for actions
      tr.querySelector('.edit-btn').addEventListener('click', () => openEditSaleModal(txn));
      tr.querySelector('.del-btn').addEventListener('click', () => deleteSale(txn.id));

      tbody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------------------
  // Main Render Orchestrator
  // -------------------------------------------------------------------------
  function render() {
    const filteredTxns = getFilteredTransactions();
    renderKPIs(filteredTxns);
    renderTrendChart(filteredTxns);
    renderCategoryChart(filteredTxns);
    renderInsights(filteredTxns);
    renderTable(filteredTxns);
  }

  // -------------------------------------------------------------------------
  // Modals & Form Handlers
  // -------------------------------------------------------------------------
  function openNewSaleModal() {
    state.editingId = null;
    elements.modalTitle.textContent = 'Record New Sale';
    elements.saleForm.reset();
    elements.saleIdInput.value = '';
    elements.saleDateInput.value = new Date().toISOString().split('T')[0];
    elements.unitsInput.value = '1';
    elements.saleModal.classList.add('open');
    elements.saleModal.setAttribute('aria-hidden', 'false');
    elements.customerNameInput.focus();
  }

  function openEditSaleModal(txn) {
    state.editingId = txn.id;
    elements.modalTitle.textContent = `Edit Sale (${txn.orderId})`;
    elements.saleIdInput.value = txn.id;
    elements.customerNameInput.value = txn.customer;
    elements.productNameInput.value = txn.product;
    elements.categorySelect.value = txn.category;
    elements.amountInput.value = txn.amount;
    elements.unitsInput.value = txn.units || 1;
    elements.saleDateInput.value = txn.date;
    elements.paymentMethodSelect.value = txn.payment;
    elements.statusSelect.value = txn.status;

    elements.saleModal.classList.add('open');
    elements.saleModal.setAttribute('aria-hidden', 'false');
    elements.customerNameInput.focus();
  }

  function closeModal() {
    elements.saleModal.classList.remove('open');
    elements.saleModal.setAttribute('aria-hidden', 'true');
    elements.saleForm.reset();
    state.editingId = null;
  }

  function handleSaleFormSubmit(e) {
    e.preventDefault();

    const customer = elements.customerNameInput.value.trim();
    const product = elements.productNameInput.value.trim();
    const category = elements.categorySelect.value;
    const amount = parseFloat(elements.amountInput.value);
    const units = parseInt(elements.unitsInput.value, 10) || 1;
    const date = elements.saleDateInput.value;
    const payment = elements.paymentMethodSelect.value;
    const status = elements.statusSelect.value;

    if (!customer || !product || isNaN(amount) || amount <= 0 || !date) {
      showToast('Please fill out all required fields with valid values.');
      return;
    }

    if (state.editingId) {
      // Edit existing
      const index = state.transactions.findIndex(t => t.id === state.editingId);
      if (index !== -1) {
        state.transactions[index] = {
          ...state.transactions[index],
          customer,
          product,
          category,
          amount,
          units,
          date,
          payment,
          status
        };
        showToast(`Updated order ${state.transactions[index].orderId}`);
      }
    } else {
      // Create new
      const orderNum = Math.floor(Math.random() * 9000) + 1000;
      const newTxn = {
        id: 'txn_' + Date.now(),
        orderId: `ORD-${orderNum}`,
        customer,
        product,
        category,
        amount,
        units,
        date,
        payment,
        status,
        createdAt: Date.now()
      };
      state.transactions.unshift(newTxn);
      showToast(`Logged new sale: $${amount.toLocaleString()} (${customer})`);
    }

    saveTransactions();
    closeModal();
    render();
  }

  function deleteSale(id) {
    const item = state.transactions.find(t => t.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to delete order ${item.orderId} for ${item.customer}?`)) {
      state.transactions = state.transactions.filter(t => t.id !== id);
      saveTransactions();
      showToast(`Deleted order ${item.orderId}`);
      render();
    }
  }

  // -------------------------------------------------------------------------
  // Settings & Data Export / Import
  // -------------------------------------------------------------------------
  function openSettingsModal() {
    elements.monthlyTargetInput.value = state.settings.monthlyQuota || 120000;
    elements.settingsModal.classList.add('open');
    elements.settingsModal.setAttribute('aria-hidden', 'false');
  }

  function closeSettingsModal() {
    elements.settingsModal.classList.remove('open');
    elements.settingsModal.setAttribute('aria-hidden', 'true');
  }

  function handleSaveSettings() {
    const newQuota = parseInt(elements.monthlyTargetInput.value, 10);
    if (newQuota > 0) {
      state.settings.monthlyQuota = newQuota;
      saveSettings();
      showToast('Monthly target quota saved!');
      closeSettingsModal();
      render();
    }
  }

  function exportJSON() {
    const payload = {
      version: 1,
      exportDate: new Date().toISOString(),
      settings: state.settings,
      transactions: state.transactions
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `salespulse_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    showToast('JSON backup exported successfully!');
  }

  function exportCSV() {
    if (state.transactions.length === 0) {
      showToast('No sales data to export.');
      return;
    }

    const headers = ['Order ID', 'Customer', 'Product', 'Category', 'Units', 'Amount', 'Date', 'Payment', 'Status'];
    const rows = state.transactions.map(t => [
      `"${t.orderId}"`,
      `"${t.customer.replace(/"/g, '""')}"`,
      `"${t.product.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      t.units || 1,
      t.amount,
      `"${t.date}"`,
      `"${t.payment}"`,
      `"${t.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', encodeURI(csvContent));
    dlAnchor.setAttribute('download', `sales_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();

    showToast('CSV spreadsheet exported successfully!');
  }

  function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported.transactions)) {
          state.transactions = imported.transactions;
          saveTransactions();
        }
        if (imported.settings) {
          state.settings = { ...DEFAULT_SETTINGS, ...imported.settings };
          saveSettings();
        }
        showToast('Sales data restored from backup!');
        closeSettingsModal();
        render();
      } catch (err) {
        showToast('Invalid backup file. Could not import.');
      }
      elements.importJsonFile.value = '';
    };
    reader.readAsText(file);
  }

  function restoreSamples() {
    if (confirm('Reset transactions to factory sample dataset?')) {
      state.transactions = generateSampleData();
      saveTransactions();
      showToast('Sample dataset reloaded.');
      closeSettingsModal();
      render();
    }
  }

  function clearAllData() {
    if (confirm('Are you sure you want to wipe ALL transactions? This cannot be undone.')) {
      state.transactions = [];
      saveTransactions();
      showToast('All transaction data wiped.');
      closeSettingsModal();
      render();
    }
  }

  // -------------------------------------------------------------------------
  // Event Listeners Binding
  // -------------------------------------------------------------------------
  function setupEventListeners() {
    // Toolbar Filters
    elements.timeRangeSelect.addEventListener('change', (e) => {
      state.filters.timeRange = e.target.value;
      render();
    });

    elements.categoryFilterSelect.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      render();
    });

    elements.statusFilterSelect.addEventListener('change', (e) => {
      state.filters.status = e.target.value;
      render();
    });

    elements.tableSearchInput.addEventListener('input', (e) => {
      state.filters.search = e.target.value.trim();
      renderTable(getFilteredTransactions());
    });

    elements.quickSeedBtn.addEventListener('click', restoreSamples);

    // Modals
    elements.openNewSaleBtn.addEventListener('click', openNewSaleModal);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.cancelModalBtn.addEventListener('click', closeModal);
    elements.saleForm.addEventListener('submit', handleSaleFormSubmit);

    elements.openSettingsBtn.addEventListener('click', openSettingsModal);
    elements.closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    elements.closeSettingsBtn.addEventListener('click', closeSettingsModal);
    elements.saveSettingsBtn.addEventListener('click', handleSaveSettings);

    elements.exportJsonBtn.addEventListener('click', exportJSON);
    elements.exportCsvBtn.addEventListener('click', exportCSV);
    elements.importJsonFile.addEventListener('change', handleImportJSON);
    elements.reloadSamplesBtn.addEventListener('click', restoreSamples);
    elements.clearAllDataBtn.addEventListener('click', clearAllData);

    // Click outside to close modals
    elements.saleModal.addEventListener('click', (e) => {
      if (e.target === elements.saleModal) closeModal();
    });
    elements.settingsModal.addEventListener('click', (e) => {
      if (e.target === elements.settingsModal) closeSettingsModal();
    });

    // Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        closeSettingsModal();
      }
    });

    // Table Header Sorting
    elements.tableHeaderCells.forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.sort;
        if (state.sort.column === col) {
          state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
          state.sort.column = col;
          state.sort.direction = 'desc';
        }

        elements.tableHeaderCells.forEach(cell => {
          cell.textContent = cell.textContent.replace(' ▲', '').replace(' ▼', '');
        });
        th.textContent += state.sort.direction === 'asc' ? ' ▲' : ' ▼';

        renderTable(getFilteredTransactions());
      });
    });

    // Responsive chart redraw on resize
    window.addEventListener('resize', () => {
      renderTrendChart(getFilteredTransactions());
    });
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  function init() {
    loadData();
    setupEventListeners();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
