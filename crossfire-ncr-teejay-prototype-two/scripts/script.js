/* ===== Declarations ===== */

const userType = sessionStorage.getItem('userType');
const contentArea = document.getElementById('mainContent');
const widgets = document.getElementById("widgets");
const filterContainer = document.getElementById("filterContainer");
const ncrTable = document.getElementById("ncrTable");
const ncrFormHeader = document.getElementById("ncrFormHeader");
const ncrForm = document.getElementById("ncrForm");
const pageTitle = document.querySelector('.homeSection #pageTitle h1');
const searchIt = document.getElementById("btnSearch");

let allSuppliers = [];
let allStatuses = [];

let currentSortColumn = 'ncrNo';
let currentSortOrder = 'desc';

let sidebar = document.querySelector(".sidebar");
let closeBtn = document.querySelector("#btn");
let searchBtn = document.querySelector(".searchBar");

const body = document.querySelector("body"),
  toggle = body.querySelector(".toggle"),
  modeSwitch = body.querySelector(".toggle-switch"),
  modeText = body.querySelector(".mode-text");

closeBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  menuBtnChange();
});

searchBtn.addEventListener("click", () => {
  // sidebar.classList.toggle("open");
  sidebar.classList.add("open");
  menuBtnChange();
});

/* ===== Functions ===== */

function menuBtnChange() {
  if (sidebar.classList.contains("open")) {
    closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");
  } else {
    closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");
  }
}

modeSwitch.addEventListener("click", () => {
  body.classList.toggle("dark");

  if (body.classList.contains("dark")) {
    modeText.innerText = "Light mode";
  } else {
    modeText.innerText = "Dark mode";
  }
});

function initializeForm(userType, currentUsername, currentDate) {
  if (userType === 'Engr') {
    const engineeringSection = document.getElementById('engineeringSection');
    if (engineeringSection) {
      engineeringSection.scrollIntoView({ behavior: 'smooth' });
    }
    const dispositionReview1 = document.getElementById('dispositionReview1');
    if (dispositionReview1) {
      dispositionReview1.focus();
    }

    const engineerName = document.getElementById('engineerName');
    const engineerReportingDate = document.getElementById('engineerReportingDate');
    if (engineerName && !engineerName.value) {
      engineerName.value = currentUsername;
    }
    if (engineerReportingDate && !engineerReportingDate.value) {
      engineerReportingDate.value = currentDate;
    }

  } else if (userType === 'Q-Rep' || userType === 'Admin') {
    const qualityRepSection = document.getElementById('qualityRepSection');
    if (qualityRepSection) {
      qualityRepSection.scrollIntoView({ behavior: 'smooth' });
    }
    const processApplicable1 = document.getElementById('processApplicable1');
    if (processApplicable1) {
      processApplicable1.focus();
    }

    const qualityRepName = document.getElementById('qualityRepName');
    const qualityRepReportingDate = document.getElementById('qualityRepReportingDate');
    if (qualityRepName && !qualityRepName.value) {
      qualityRepName.value = currentUsername;
    }
    if (qualityRepReportingDate && !qualityRepReportingDate.value) {
      qualityRepReportingDate.value = currentDate;
    }
  }
}

function loadPage(page) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', page, true);

  xhr.onload = async function () {
    if (this.status === 200) {
      contentArea.innerHTML = this.responseText;

      updatePermissions();

      widgets.style.display = "none";
      filterContainer.style.display = "none";
      ncrTable.style.display = "none";

      switch (page) {
        case 'index.html':
          widgets.style.display = "grid";
          pageTitle.textContent = 'Dashboard';
          break;

        case 'view.html':
          pageTitle.textContent = 'View NCRs';
          filterContainer.style.display = "grid";
          ncrTable.style.display = "table";
          await loadNCRTable();
          document.getElementById('supplierFilter').focus();
          break;

        case 'ncr-form.html':
          pageTitle.textContent = 'NCR Form';

          initializeForm(currentUserType, currentUsername, currentDate);

          break;

        case 'faqs.html':
          pageTitle.textContent = 'FAQs';
          break;

        case 'users.html':
          pageTitle.textContent = 'Users';
          break;

        default:
          pageTitle.textContent = 'Dashboard';
          break;
      }
    } else {
      contentArea.innerHTML = '<p>&emsp;Failed to load content.</p>';
    }
  };

  xhr.onerror = function () {
    contentArea.innerHTML = '<p>&emsp;There was an error loading the page.</p>';
  };

  xhr.send();
}

function toggleMenu() {
  const menu = document.querySelector('.flyingMenu');
  const chevronIcon = document.getElementById('chevron-icon');

  menu.classList.toggle('hidden');

  if (menu.classList.contains('hidden')) {
    chevronIcon.classList.remove('bx-dots-vertical-rounded');
    chevronIcon.classList.add('bx-dots-horizontal-rounded');
  } else {
    chevronIcon.classList.remove('bx-dots-horizontal-rounded');
    chevronIcon.classList.add('bx-dots-vertical-rounded');
  }
}

function disableFields() {
  alert("Disabling Fields...");
  document.querySelectorAll('input:not([type="submit"]):not([type="reset"]), select, textarea').forEach((element) => {
    element.disabled = true;
  });
}

function enableFields() {
  alert("Enabling Fields...");
  document.querySelectorAll('input, select, textarea').forEach((element) => {
    element.disabled = false;
  });
}

function exitViewMode() {
  alert("Exiting View Mode...");

  window.location.href = "index.html";
}

function populateForm(ncrData, isEditMode = false) {
  document.querySelectorAll('input[name="processApplicable"]').forEach((radio) => {
    radio.disabled = !isEditMode;
    if (radio.value === ncrData.processApplicable) {
      radio.checked = true;
    }
  });

  document.getElementById('supplierName').value = ncrData.supplierName;
  document.getElementById('descriptionItem').value = ncrData.descriptionItem;

  document.querySelectorAll('input[name="markedNonconforming"]').forEach((radio) => {
    radio.disabled = !isEditMode;
    if (radio.value === ncrData.markedNonconforming) {
      radio.checked = true;
    }
  });

  document.getElementById('ncrNo').value = ncrData.ncrNo;
  document.getElementById('prodNo').value = ncrData.prodNo;
  document.getElementById('salesOrderNo').value = ncrData.salesOrderNo;
  document.getElementById('qtyReceived').value = ncrData.qtyReceived;
  document.getElementById('qtyDefective').value = ncrData.qtyDefective;
  document.getElementById('descriptionDefect').value = ncrData.descriptionDefect;
  document.getElementById('qualityRepName').value = ncrData.qualityRepName;
  document.getElementById('qualityRepReportingDate').value = ncrData.qualityRepReportingDate;
  document.getElementById('status').value = ncrData.status;

  document.querySelectorAll('input[name="dispositionReview"]').forEach((radio) => {
    if (radio.value === ncrData.dispositionReview) {
      radio.checked = true;
    }
  });

  document.querySelectorAll('input[name="customerRequireNotification"]').forEach((radio) => {
    if (radio.value === ncrData.customerRequireNotification) {
      radio.checked = true;
    }
  });

  document.getElementById('disposition').value = ncrData.disposition;

  document.querySelectorAll('input[name="drawingRequireUpdating"]').forEach((radio) => {
    if (radio.value === ncrData.drawingRequireUpdating) {
      radio.checked = true;
    }
  });

  document.getElementById('originalRevNumber').value = ncrData.originalRevNumber;
  document.getElementById('updatedRevNumber').value = ncrData.updatedRevNumber;
  document.getElementById('engineerName').value = ncrData.engineerName;
  document.getElementById('engineerRevisionDate').value = ncrData.engineerRevisionDate;
  document.getElementById('engineerReportingDate').value = ncrData.engineerReportingDate;
}

async function viewNCR(ncrIndex) {
  const ncrRef = firestore.collection("formData").doc(ncrIndex.toString());
  try {
    const doc = await ncrRef.get();
    if (doc.exists) {
      const ncrData = doc.data();
      loadPage("ncr-form.html");

      setTimeout(() => {
        populateForm(ncrData);

        disableFields();

        const submitButton = document.getElementById("btnSubmit");
        const clearButton = document.getElementById("btnClear");

        submitButton.value = "Edit";
        submitButton.onclick = function (event) {
          event.preventDefault();
          enableFields();
          submitButton.value = "Submit";

          submitButton.onclick = function (event) {
            event.preventDefault();
            submitFormData(event);
          };

          clearButton.value = "Clear";
          clearButton.onclick = function () {
            clearForm();
          };
        };

        clearButton.value = "Exit";
        clearButton.onclick = function () {
          exitViewMode();
        };
      }, 100);
    } else {
      console.error("No NCR document found!");
    }
  } catch (error) {
    console.error("Error getting NCR data:", error);
  }
}

async function editNCR(ncrIndex) {
  const ncrRef = firestore.collection("formData").doc(ncrIndex.toString());
  try {
    const doc = await ncrRef.get();
    if (doc.exists) {
      const ncrData = doc.data();
      loadPage("ncr-form.html");

      setTimeout(() => {
        populateForm(ncrData, true);

        initializeForm(currentUserType, currentUsername, currentDate);

        const submitButton = document.getElementById("btnSubmit");
        const clearButton = document.getElementById("btnClear");

        submitButton.value = "Save Changes";
        submitButton.onclick = function (event) {
          event.preventDefault();
          submitFormData(event);
        };

        clearButton.value = "Cancel";
        clearButton.onclick = function () {
          exitEditMode();
        };
      }, 100);
    }
  } catch (error) {
    console.error("Error getting NCR data:", error);
  }
}

async function loadNCRTable(supplier = "", status = "", startDate = "", endDate = "", search = "") {
  const tableBody = document.querySelector("#ncrTable tbody");
  const supplierFilter = document.getElementById('supplierFilter');
  const statusFilter = document.getElementById('statusFilter');
  const startDateFilter = document.getElementById('startDateFilter');
  const endDateFilter = document.getElementById('endDateFilter');
  const searchInput = document.getElementById('searchInput');

  firestore.collection("formData").onSnapshot(async (snapshot) => {
    tableBody.innerHTML = "";

    const ncrDataArray = [];
    const suppliers = new Set();
    const statuses = new Map();

    snapshot.forEach((doc) => {
      const ncrData = doc.data();
      ncrData.id = doc.id;

      if (ncrData.qualityRepReportingDate instanceof firebase.firestore.Timestamp) {
        ncrData.qualityRepReportingDate = ncrData.qualityRepReportingDate.toDate().toISOString().split("T")[0];
      }

      suppliers.add(ncrData.supplierName);

      const statusCount = statuses.get(ncrData.status) || 0;
      statuses.set(ncrData.status, statusCount + 1);
      let matchSupplier = supplier ? ncrData.supplierName === supplier : true;
      let matchStatus = status ? ncrData.status === status : true;
      let matchDate = true;
      let matchSearch = true;

      if (supplier && ncrData.supplierName !== supplier) {
        matchSupplier = false;
      }

      if (status && ncrData.status !== status) {
        matchStatus = false;
      }

      if (startDate || endDate) {
        const reportDate = new Date(ncrData.qualityRepReportingDate);
        if (startDate && reportDate < new Date(startDate)) {
          matchDate = false;
        }
        if (endDate && reportDate > new Date(endDate)) {
          matchDate = false;
        }
      }

      if (search) {
        const searchLower = search.toLowerCase();
        const ncrSearchFields = [
          ncrData.ncrNo.toLowerCase(),
          ncrData.supplierName.toLowerCase(),
          ncrData.status.toLowerCase()
        ];

        matchSearch = ncrSearchFields.some(field => field.includes(searchLower));
      }

      if (matchSupplier && matchStatus && matchDate && matchSearch) {
        ncrDataArray.push(ncrData);
      }
    });

    allSuppliers = [...suppliers];
    allStatuses = [...statuses.keys()];

    populateDropdown(supplierFilter, allSuppliers, supplier);
    populateDropdown(statusFilter, allStatuses, status);

    sortData(ncrDataArray, currentSortColumn, currentSortOrder);

    ncrDataArray.forEach((ncrData) => {
      const row = document.createElement("tr");
      row.dataset.docId = ncrData.id;

      let editButton = "";
      if (userType === "Q-Rep" && ncrData.status === "Q-Rep Stage") {
        editButton = `<button class="editBtn btnAction">Edit</button>`;
      } else if (
        userType === "Engr" &&
        (ncrData.status === "Pending Engr Review" || ncrData.status === "Engr Stage")
      ) {
        editButton = `<button class="editBtn btnAction">Edit</button>`;
      } else if (userType === "Admin") {
        editButton = `<button class="editBtn btnAction">Edit</button>`;
      }

      row.innerHTML = `
        <td>${ncrData.ncrNo}</td>
        <td>${ncrData.supplierName}</td>
        <td>${ncrData.qtyReceived}</td>
        <td>${ncrData.qtyDefective}</td>
        <td>${ncrData.qualityRepReportingDate}</td>
        <td>${ncrData.status}</td>
        <td>
          <button class="viewBtn btnAction">View</button>
          ${editButton}
        </td>
      `;

      tableBody.appendChild(row);
    });

    attachEventListeners();

  }, (error) => {
    console.error("Error loading NCR table:", error);
  });
}

function applySearchFilter() {
  widgets.style.display = "none";
  ncrTable.style.display = "table";
  loadNCRTable("", "", "", "", document.getElementById("btnSearch").value.trim());

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function populateDropdown(dropdown, values, selectedValue) {
  dropdown.innerHTML = '<option value="">All</option>';
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;

    if (value === selectedValue) {
      option.selected = true;
    }

    dropdown.appendChild(option);
  });
}

document.getElementById('supplierFilter').addEventListener('change', function () {
  const supplier = this.value;
  const status = document.getElementById('statusFilter').value;
  const startDate = document.getElementById('startDateFilter').value;
  const endDate = document.getElementById('endDateFilter').value;
  const search = document.getElementById('searchInput').value;
  loadNCRTable(supplier, status, startDate, endDate, search);
});

document.getElementById('statusFilter').addEventListener('change', function () {
  const status = this.value;
  const supplier = document.getElementById('supplierFilter').value;
  const startDate = document.getElementById('startDateFilter').value;
  const endDate = document.getElementById('endDateFilter').value;
  const search = document.getElementById('searchInput').value;
  loadNCRTable(supplier, status, startDate, endDate, search);
});

document.getElementById('startDateFilter').addEventListener('change', function () {
  const startDate = this.value;
  const status = document.getElementById('statusFilter').value;
  const supplier = document.getElementById('supplierFilter').value;
  const endDate = document.getElementById('endDateFilter').value;
  const search = document.getElementById('searchInput').value;
  loadNCRTable(supplier, status, startDate, endDate, search);
});

document.getElementById('endDateFilter').addEventListener('change', function () {
  const endDate = this.value;
  const status = document.getElementById('statusFilter').value;
  const supplier = document.getElementById('supplierFilter').value;
  const startDate = document.getElementById('startDateFilter').value;
  const search = document.getElementById('searchInput').value;
  loadNCRTable(supplier, status, startDate, endDate, search);
});

document.getElementById('searchInput').addEventListener('input', function () {
  const search = this.value;
  const supplier = document.getElementById('supplierFilter').value;
  const status = document.getElementById('statusFilter').value;
  const startDate = document.getElementById('startDateFilter').value;
  const endDate = document.getElementById('endDateFilter').value;
  loadNCRTable(supplier, status, startDate, endDate, search);
});

document.getElementById('clearFilters').addEventListener('click', function () {
  document.getElementById('supplierFilter').value = "";
  document.getElementById('statusFilter').value = "";
  document.getElementById('startDateFilter').value = "";
  document.getElementById('endDateFilter').value = "";
  document.getElementById('searchInput').value = "";
  loadNCRTable();
});

function sortData(dataArray, column, sortOrder) {
  dataArray.sort((a, b) => {
    if (a[column] < b[column]) return sortOrder === 'asc' ? -1 : 1;
    if (a[column] > b[column]) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

function attachEventListeners() {
  const tableBody = document.querySelector("#ncrTable tbody");

  tableBody.addEventListener("click", function (event) {
    const clickedElement = event.target;
    const row = clickedElement.closest("tr");
    const docId = row?.dataset.docId;

    if (!docId) return;

    if (clickedElement.classList.contains("viewBtn")) {
      viewNCR(docId);
    } else if (clickedElement.classList.contains("editBtn")) {
      editNCR(docId);
    } else if (clickedElement.classList.contains("deleteBtn")) {
      deleteNCR(docId);
    }
  });
  document.getElementById("ncrNoAsc").addEventListener("click", function () {
    setSortOrder('ncrNo', 'asc');
  });

  document.getElementById("ncrNoDesc").addEventListener("click", function () {
    setSortOrder('ncrNo', 'desc');
  });

  document.getElementById("supplierNameAsc").addEventListener("click", function () {
    setSortOrder('supplierName', 'asc');
  });

  document.getElementById("supplierNameDesc").addEventListener("click", function () {
    setSortOrder('supplierName', 'desc');
  });

  document.getElementById("qtyReceivedAsc").addEventListener("click", function () {
    setSortOrder('qtyReceived', 'asc');
  });

  document.getElementById("qtyReceivedDesc").addEventListener("click", function () {
    setSortOrder('qtyReceived', 'desc');
  });

  document.getElementById("qtyDefectiveAsc").addEventListener("click", function () {
    setSortOrder('qtyDefective', 'asc');
  });

  document.getElementById("qtyDefectiveDesc").addEventListener("click", function () {
    setSortOrder('qtyDefective', 'desc');
  });

  document.getElementById("qualityRepReportingDateAsc").addEventListener("click", function () {
    setSortOrder('qualityRepReportingDate', 'asc');
  });

  document.getElementById("qualityRepReportingDateDesc").addEventListener("click", function () {
    setSortOrder('qualityRepReportingDate', 'desc');
  });

  document.getElementById("statusAsc").addEventListener("click", function () {
    setSortOrder('status', 'asc');
  });

  document.getElementById("statusDesc").addEventListener("click", function () {
    setSortOrder('status', 'desc');
  });
}

function setSortOrder(column, order) {
  currentSortColumn = column;
  currentSortOrder = order;
  loadNCRTable();
}

loadNCRTable();

if (window.location.pathname.includes("index.html")) {
  document.getElementById("filterContainer").style.display = "none";
  document.getElementById("ncrTable").style.display = "table";
  window.onload = function () {
    loadNCRTable();
  };
} else {
  // document.getElementById("ncrTable").style.display = "none";
  filterContainer.display = "none";
}

async function deleteNCR(ncrIndex) {
  const confirmDelete = confirm("Are you sure you want to delete this NCR?");
  if (confirmDelete) {
    try {
      await firestore.collection("formData").doc(ncrIndex).delete();
      loadNCRTable();
      alert("NCR deleted successfully.");
    } catch (error) {
      console.error("Error deleting NCR:", error);
    }
  }
}

function toggleAnswer(faqElement) {
  const answer = faqElement.querySelector('.answer');
  answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
}