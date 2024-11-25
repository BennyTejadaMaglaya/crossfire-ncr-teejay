/* ===== Widgets ===== */

const STATUS_COLORS = { Active: "#FF6384", Pending: "#FFCE56", Reviewed: "#173451", Closed: "#5897C9" };
const STATUS_LABELS = ["Active", "Pending", "Reviewed", "Closed"];
const charts = { statusChart: null, monthChart: null, supplierChart: null };

currentSupplierTableSortColumn = "supplier";
currentSupplierTableSortOrder = "asc";

function preprocessNCRData(ncrDataArray) {
    const dataByStatus = { Active: 0, Pending: 0, Reviewed: 0, Closed: 0 };
    const dataByMonth = {};
    const dataBySupplier = {};
    const qtyData = {};
    const recentNCRs = [];

    ncrDataArray.forEach((ncr) => {
        if (!ncr.status || !ncr.supplierName || !ncr.qualityRepReportingDate) {
            console.warn("Invalid NCR data:", ncr);
            return;
        }

        if (ncr.status in dataByStatus) dataByStatus[ncr.status]++;

        const date = new Date(ncr.qualityRepReportingDate);
        const month = date.toLocaleString("default", { month: "short", year: "numeric" });
        dataByMonth[month] = dataByMonth[month] || { Active: 0, Pending: 0, Reviewed: 0, Closed: 0 };
        if (ncr.status in dataByMonth[month]) dataByMonth[month][ncr.status]++;
        const supplier = ncr.supplierName;
        dataBySupplier[supplier] = dataBySupplier[supplier] || { Active: 0, Pending: 0, Reviewed: 0, Closed: 0 };
        if (ncr.status in dataBySupplier[supplier]) dataBySupplier[supplier][ncr.status]++;

        qtyData[supplier] = qtyData[supplier] || { qtyReceived: 0, qtyDefective: 0 };
        qtyData[supplier].qtyReceived += ncr.qtyReceived || 0;
        qtyData[supplier].qtyDefective += ncr.qtyDefective || 0;

        if (ncr.status === "Active") recentNCRs.push(ncr);
    });

    recentNCRs.sort((a, b) => new Date(b.qualityRepReportingDate) - new Date(a.qualityRepReportingDate));

    return { dataByStatus, dataByMonth, dataBySupplier, qtyData, recentNCRs };
}

function updateChart(chartKey, ctx, type, labels, datasets, options) {
    const config = {
        type,
        data: { labels, datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { position: "top" },
                tooltip: { callbacks: options.tooltipCallbacks || {} },
                title: options.title || null,
            },
            scales: options.scales || {},
        },
    };

    if (charts[chartKey]) {
        charts[chartKey].data = config.data;
        charts[chartKey].options = config.options;
        charts[chartKey].update();
    } else {
        charts[chartKey] = new Chart(ctx, config);
    }
}

function updateStatusPieChart(dataByStatus) {
    const ctx = document.getElementById("statusPieChart").getContext("2d");
    const data = STATUS_LABELS.map((status) => dataByStatus[status]);
    const total = data.reduce((sum, count) => sum + count, 0);

    document.getElementById("statusCounters").innerHTML =
        STATUS_LABELS.map((status, i) =>
            `<p><strong>${status} :</strong> ${data[i]} (${((data[i] / total) * 100).toFixed(1)}%)</p>`
        ).join("") + `<p><strong>Total NCRs :</strong> ${total}</p>`;

    updateChart("statusChart", ctx, "doughnut", STATUS_LABELS, [{
        label: "Status Distribution",
        data,
        backgroundColor: STATUS_LABELS.map((status) => STATUS_COLORS[status]),
    }], {
        tooltipCallbacks: {
            label: (tooltipItem) => {
                const count = tooltipItem.raw;
                const percentage = ((count / total) * 100).toFixed(1);
                return `${STATUS_LABELS[tooltipItem.dataIndex]}: ${count} (${percentage}%)`;
            },
        },
    });
}

function calculateRatio(defective, received) {
    if (received > 0) {
        const percentage = ((defective / received) * 100).toFixed(2);
        return { ratio: `${defective}:${received}`, percentage: `${percentage}%` };
    }
    return { ratio: "N/A", percentage: "N/A" };
}

function getTotalNCRs(supplierData) {
    return Object.values(supplierData).reduce((sum, count) => sum + (count || 0), 0);
}

function generateTooltip(labels, tooltipItem, qtyData, dataBySupplier) {
    const supplier = labels[tooltipItem.dataIndex];
    const { qtyDefective, qtyReceived } = qtyData[supplier] || {};
    const { ratio, percentage } = calculateRatio(qtyDefective, qtyReceived);
    const totalNCRs = getTotalNCRs(dataBySupplier[supplier]);

    return `${tooltipItem.dataset.label}: ${tooltipItem.raw} | ` +
        `Def/Rec %: ${percentage} | ` +
        `Total NCRs: ${totalNCRs}`;
}

function updateNCRsBySupplierCounter(dataBySupplier, qtyData) {
    const labels = Object.keys(dataBySupplier);

    // Sort suppliers by total NCRs (highest to lowest)
    const sortedLabels = labels.sort((a, b) => {
        const totalA = getTotalNCRs(dataBySupplier[a]);
        const totalB = getTotalNCRs(dataBySupplier[b]);
        return totalB - totalA; // Sort descending by total NCRs
    });

    let highestRatioSupplier = null;
    let highestRatio = -Infinity;
    let lowestRatioSupplier = null;
    let lowestRatio = Infinity;

    sortedLabels.forEach((supplier) => {
        const { qtyDefective, qtyReceived } = qtyData[supplier] || {};
        const { percentage } = calculateRatio(qtyDefective, qtyReceived);

        if (parseFloat(percentage) > highestRatio) {
            highestRatio = parseFloat(percentage);
            highestRatioSupplier = supplier;
        }

        if (parseFloat(percentage) < lowestRatio) {
            lowestRatio = parseFloat(percentage);
            lowestRatioSupplier = supplier;
        }
    });

    const mostNCRs = getTotalNCRs(dataBySupplier[sortedLabels[0]]);
    const suppliersWithMostNCRs = sortedLabels.filter((supplier) => {
        return getTotalNCRs(dataBySupplier[supplier]) === mostNCRs;
    });

    const leastNCRs = getTotalNCRs(dataBySupplier[sortedLabels[sortedLabels.length - 1]]);
    const suppliersWithLeastNCRs = sortedLabels.filter((supplier) => {
        return getTotalNCRs(dataBySupplier[supplier]) === leastNCRs;
    });

    const lowestDefectivePercentage = lowestRatio.toFixed(2);
    const suppliersWithLowestRatio = sortedLabels.filter((supplier) => {
        const { qtyDefective, qtyReceived } = qtyData[supplier] || {};
        const { percentage } = calculateRatio(qtyDefective, qtyReceived);
        return parseFloat(percentage) === lowestRatio;
    });

    const highestDefectivePercentage = highestRatio.toFixed(2);

    document.getElementById("supplierSummary").innerHTML =
        `<p><strong>Most Reported NCRs :</strong> ${suppliersWithMostNCRs.join(', ')} (${mostNCRs} NCRs)</p>
        <p><strong>Fewest Reported NCRs :</strong> ${suppliersWithLeastNCRs.join(', ')} (${leastNCRs} NCRs)</p>
        <br>
        <p><strong>Highest Defective-to-Received Ratio (%) :</strong> ${highestRatioSupplier} (${highestDefectivePercentage}%)</p>
        <p><strong>Lowest Defective-to-Received Ratio (%) :</strong> ${suppliersWithLowestRatio.join(', ')} (${lowestDefectivePercentage}%)</p>`;
}

function displaySupplierTable(labels, qtyData, dataBySupplier) {
    const tableContainer = document.getElementById("ncrsBySupplierCounters");

    const supplierData = labels.map((supplier) => {
        const qtyDefective = parseInt(qtyData[supplier]?.qtyDefective) || 0;
        const qtyReceived = parseInt(qtyData[supplier]?.qtyReceived) || 0;
        const ncrCount = (dataBySupplier[supplier]?.Active || 0) +
            (dataBySupplier[supplier]?.Pending || 0) +
            (dataBySupplier[supplier]?.Reviewed || 0) +
            (dataBySupplier[supplier]?.Closed || 0);

        const ratioString = qtyReceived > 0
            ? `${qtyDefective}:${qtyReceived}`
            : "N/A";

        const percentage = qtyReceived > 0
            ? ((qtyDefective / qtyReceived) * 100).toFixed(2)
            : "N/A";

        return {
            supplier,
            qtyDefective,
            qtyReceived,
            ratioString,
            percentage: percentage === "N/A" ? "N/A" : parseFloat(percentage),
            ncrCount,
        };
    });

    const sortedSupplierData = supplierData.sort((a, b) => {
        const valueA = a[currentSupplierTableSortColumn];
        const valueB = b[currentSupplierTableSortColumn];

        if (valueA === "N/A" || valueB === "N/A") {
            return valueA === "N/A" ? 1 : -1; // N/A values go to the bottom
        }

        if (typeof valueA === "string") {
            return currentSupplierTableSortOrder === "asc"
                ? valueA.localeCompare(valueB)
                : valueB.localeCompare(valueA);
        }

        return currentSupplierTableSortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

    let tableContent = `
    <h3>Supplier Table</h3>
    <table id="ncrSupplierTable">
        <thead>
            <tr>
                <th>Supplier Name
                    <button id="sortSupplierAsc" class="sortButton">▲</button>
                    <button id="sortSupplierDesc" class="sortButton">▼</button>
                </th>
                <th>Qty Received
                    <button id="sortReceivedAsc" class="sortButton">▲</button>
                    <button id="sortReceivedDesc" class="sortButton">▼</button>
                </th>
                <th>Qty Defective
                    <button id="sortDefectiveAsc" class="sortButton">▲</button>
                    <button id="sortDefectiveDesc" class="sortButton">▼</button>
                </th>
                <th>Defective-to-Received Ratio (%)
                    <button id="sortPercentageAsc" class="sortButton">▲</button>
                    <button id="sortPercentageDesc" class="sortButton">▼</button>
                </th>
                <th>Total NCRs
                    <button id="sortNCRAsc" class="sortButton">▲</button>
                    <button id="sortNCRDesc" class="sortButton">▼</button>
                </th>
            </tr>
        </thead>
        <tbody>
  `;

    sortedSupplierData.forEach((data) => {
        tableContent += `
      <tr>
        <td>${data.supplier}</td>
        <td>${data.qtyReceived}</td>
        <td>${data.qtyDefective}</td>
        <td>${data.percentage === "N/A" ? "N/A" : `${data.percentage.toFixed(2)}%`}</td>
        <td>${data.ncrCount}</td>
      </tr>
    `;
    });

    tableContent += "</tbody></table>";
    tableContainer.innerHTML = tableContent;

    attachSupplierTableEventListeners(labels, qtyData, dataBySupplier);
}

function attachSupplierTableEventListeners(labels, qtyData, dataBySupplier) {
    document.getElementById("sortSupplierAsc").addEventListener("click", () =>
        setSupplierTableSortOrder("supplier", "asc", labels, qtyData, dataBySupplier)
    );
    document.getElementById("sortSupplierDesc").addEventListener("click", () =>
        setSupplierTableSortOrder("supplier", "desc", labels, qtyData, dataBySupplier)
    );

    document.getElementById("sortReceivedAsc").addEventListener("click", () =>
        setSupplierTableSortOrder("qtyReceived", "asc", labels, qtyData, dataBySupplier)
    );
    document.getElementById("sortReceivedDesc").addEventListener("click", () =>
        setSupplierTableSortOrder("qtyReceived", "desc", labels, qtyData, dataBySupplier)
    );

    document.getElementById("sortDefectiveAsc").addEventListener("click", () =>
        setSupplierTableSortOrder("qtyDefective", "asc", labels, qtyData, dataBySupplier)
    );
    document.getElementById("sortDefectiveDesc").addEventListener("click", () =>
        setSupplierTableSortOrder("qtyDefective", "desc", labels, qtyData, dataBySupplier)
    );

    document.getElementById("sortPercentageAsc").addEventListener("click", () =>
        setSupplierTableSortOrder("percentage", "asc", labels, qtyData, dataBySupplier)
    );
    document.getElementById("sortPercentageDesc").addEventListener("click", () =>
        setSupplierTableSortOrder("percentage", "desc", labels, qtyData, dataBySupplier)
    );

    document.getElementById("sortNCRAsc").addEventListener("click", () =>
        setSupplierTableSortOrder("ncrCount", "asc", labels, qtyData, dataBySupplier)
    );
    document.getElementById("sortNCRDesc").addEventListener("click", () =>
        setSupplierTableSortOrder("ncrCount", "desc", labels, qtyData, dataBySupplier)
    );
}

function setSupplierTableSortOrder(column, order, labels, qtyData, dataBySupplier) {
    currentSupplierTableSortColumn = column;
    currentSupplierTableSortOrder = order;
    displaySupplierTable(labels, qtyData, dataBySupplier);
}

function updateNCRsBySupplierChart(dataBySupplier, qtyData) {
    const ctx = document.getElementById("ncrsBySupplierChart").getContext("2d");
    const labels = Object.keys(dataBySupplier);
    const datasets = STATUS_LABELS.map((status) => ({
        label: status,
        data: labels.map((supplier) => dataBySupplier[supplier][status] || 0),
        backgroundColor: STATUS_COLORS[status],
    }));

    updateChart("ncrsBySupplierChart", ctx, "bar", labels, datasets, {
        tooltipCallbacks: {
            label: (tooltipItem) => generateTooltip(labels, tooltipItem, qtyData, dataBySupplier),
        },
        scales: { x: { stacked: true }, y: { stacked: true } },
    });
    updateNCRsBySupplierCounter(dataBySupplier, qtyData);
    displaySupplierTable(labels, qtyData, dataBySupplier);
}

function createNCRsByMonthTable(labels, totals, dateRangeTitle) {
    const tableContainer = document.getElementById("ncrsByMonthCounters");

    const title = document.querySelector("h3");
    title.textContent = `NCRs by Month (${dateRangeTitle})`;

    const table = document.createElement("table");
    table.setAttribute("id", "ncrsByMonthTable");
    table.setAttribute("class", "table table-striped");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const th1 = document.createElement("th");
    th1.textContent = "Month";
    const th2 = document.createElement("th");
    th2.textContent = "Total NCRs";
    headerRow.appendChild(th1);
    headerRow.appendChild(th2);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    labels.forEach((month, index) => {
        const row = document.createElement("tr");
        const td1 = document.createElement("td");
        td1.textContent = month;
        const td2 = document.createElement("td");
        td2.textContent = totals[index];
        row.appendChild(td1);
        row.appendChild(td2);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    tableContainer.innerHTML = "";
    tableContainer.appendChild(title);
    tableContainer.appendChild(table);
}

function updateNCRsByMonthChart(dataByMonth) {
    const ctx = document.getElementById("ncrsByMonthChart").getContext("2d");

    const labels = Object.keys(dataByMonth).sort((a, b) => new Date(a) - new Date(b));

    // Filter for the most recent six months
    const recentLabels = labels.slice(-6);

    const datasets = STATUS_LABELS.map((status) => ({
        label: status,
        data: recentLabels.map((month) => dataByMonth[month][status] || 0),
        backgroundColor: STATUS_COLORS[status],
    }));

    const totals = recentLabels.map((month) =>
        Object.values(dataByMonth[month]).reduce((sum, count) => sum + count, 0)
    );

    const dateRangeTitle = `From ${recentLabels[0]} to ${recentLabels[recentLabels.length - 1]}`;

    updateChart("ncrsByMonthChart", ctx, "bar", recentLabels, datasets, {
        tooltipCallbacks: {
            label: (tooltipItem) => {
                const count = tooltipItem.raw;
                const month = recentLabels[tooltipItem.dataIndex];
                const totalNCRs = totals[tooltipItem.dataIndex];
                return `${tooltipItem.dataset.label}: ${count} | Total NCRs: ${totalNCRs}`;
            },
        },
        title: { display: true, text: `NCRs by Month (${dateRangeTitle})` },
        scales: { x: { stacked: true }, y: { stacked: true } },
    });

    createNCRsByMonthTable(recentLabels, totals, dateRangeTitle);
}

firestore.collection("formData").onSnapshot((snapshot) => {
    const processedData = preprocessNCRData(snapshot.docs.map((doc) => doc.data()));
    updateStatusPieChart(processedData.dataByStatus);
    updateNCRsBySupplierChart(processedData.dataBySupplier, processedData.qtyData);
    updateNCRsByMonthChart(processedData.dataByMonth);
});