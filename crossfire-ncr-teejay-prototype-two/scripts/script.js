/* ===== Declarations ===== */

const userType = sessionStorage.getItem('userType');
const contentArea = document.getElementById('mainContent');
const ncrNotificationContainer = document.getElementById("ncrNotificationContainer");
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

function initializeForm(userType, currentName, currentDate) {
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
      engineerName.value = currentName;
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
      qualityRepName.value = currentName;
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

      ncrNotificationContainer.style.display = "none";
      widgets.style.display = "none";
      filterContainer.style.display = "none";
      ncrTable.style.display = "none";

      switch (page) {
        case 'index.html':
          ncrNotificationContainer.style.display = "table";
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
          var importLabel = document.getElementById("importLabel");
          importLabel.style.display = "block";
          var btnImport = document.getElementById("btnImport");
          btnImport.style.display = "block";
          initializeForm(currentUserType, currentName, currentDate);

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

function exitViewMode() {
  alert("Exiting View Mode...");

  window.location.href = "index.html";
}

function populateForm(ncrData, isEditMode = false) {
  function replaceInputWithP(inputElement, value) {
    const p = document.createElement('p');
    p.textContent = value || 'N/A';
    p.style.marginBottom = '25px';
    inputElement.parentElement.replaceChild(p, inputElement);
  }

  function displaySelectedRadioValue(radioElements, selectedValue) {
    radioElements.forEach((radio) => {
      const label = radio.nextElementSibling;
      const tooltip = label ? label.querySelector('.tooltip-message') : null;

      if (label) {
        label.style.display = 'none';
      }

      if (radio.value === selectedValue) {
        replaceInputWithP(radio, radio.value);
      } else {
        radio.style.display = 'none';
        if (label) {
          label.style.display = 'none';
        }
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      }
    });
  }

  if (!isEditMode) {
    hideMediaUploadAndCheckbox();
  }

  const processApplicableRadios = document.querySelectorAll('input[name="processApplicable"]');
  if (isEditMode) {
    processApplicableRadios.forEach((radio) => {
      radio.disabled = false;
      if (radio.value === ncrData.processApplicable) {
        radio.checked = true;
      }
    });
  } else {
    displaySelectedRadioValue(processApplicableRadios, ncrData.processApplicable);
  }

  const fields = [
    'supplierName', 'descriptionItem', 'ncrNo', 'prodNo', 'salesOrderNo', 'qtyReceived',
    'qtyDefective', 'descriptionDefect', 'qualityRepName', 'qualityRepReportingDate', 'disposition',
    'originalRevNumber', 'updatedRevNumber', 'engineerName', 'engineerRevisionDate', 'engineerReportingDate'
  ];

  fields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
      if (isEditMode) {
        element.value = ncrData[field];
      } else {
        replaceInputWithP(element, ncrData[field]);
      }
    }
  });

  const markedNonconformingRadios = document.querySelectorAll('input[name="markedNonconforming"]');
  if (isEditMode) {
    markedNonconformingRadios.forEach((radio) => {
      radio.disabled = false;
      if (radio.value === ncrData.markedNonconforming) {
        radio.checked = true;
      }
    });
  } else {
    displaySelectedRadioValue(markedNonconformingRadios, ncrData.markedNonconforming);
  }

  const dispositionReviewRadios = document.querySelectorAll('input[name="dispositionReview"]');
  if (isEditMode) {
    dispositionReviewRadios.forEach((radio) => {
      radio.disabled = false;
      if (radio.value === ncrData.dispositionReview) {
        radio.checked = true;
      }
    });
  } else {
    displaySelectedRadioValue(dispositionReviewRadios, ncrData.dispositionReview);
  }

  const customerRequireNotificationRadios = document.querySelectorAll('input[name="customerRequireNotification"]');
  if (isEditMode) {
    customerRequireNotificationRadios.forEach((radio) => {
      radio.disabled = false;
      if (radio.value === ncrData.customerRequireNotification) {
        radio.checked = true;
      }
    });
  } else {
    displaySelectedRadioValue(customerRequireNotificationRadios, ncrData.customerRequireNotification);
  }

  const drawingRequireUpdatingRadios = document.querySelectorAll('input[name="drawingRequireUpdating"]');
  if (isEditMode) {
    drawingRequireUpdatingRadios.forEach((radio) => {
      radio.disabled = false;
      if (radio.value === ncrData.drawingRequireUpdating) {
        radio.checked = true;
      }
    });
  } else {
    displaySelectedRadioValue(drawingRequireUpdatingRadios, ncrData.drawingRequireUpdating);
  }
}

function hideMediaUploadAndCheckbox() {
  const mediaLabel = document.querySelector('label[for="mediaUpload"]');
  const mediaInput = document.getElementById('mediaUpload');
  const fileCount = document.getElementById('fileCount');
  const preview = document.getElementById('preview');

  if (mediaLabel) {
    mediaLabel.style.display = 'none';
  }

  if (mediaInput) {
    mediaInput.style.display = 'none';
  }

  if (fileCount) {
    fileCount.style.display = 'none';
  }

  if (preview) {
    preview.style.display = 'none';
  }

  const checkboxLabel = document.querySelector('label[for="closeNCRCheckbox"]');
  const checkboxInput = document.getElementById('closeNCRCheckbox');

  if (checkboxLabel) {
    checkboxLabel.style.display = 'none';
  }

  if (checkboxInput) {
    checkboxInput.style.display = 'none';
  }
}

async function printPDF() {
  const jsPDF = window.jspdf.jsPDF;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const topMargin = 10;

  function addPageNumber(pdf, pageNumber, totalPages) {
    pdf.setFontSize(10);
    pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
  }

  const qualityRepSection = document.querySelector('#qualityRepSection');
  const qualityRepCanvas = await html2canvas(qualityRepSection, { backgroundColor: null });
  const qualityRepImage = qualityRepCanvas.toDataURL('image/png');
  const qualityRepHeight = (qualityRepCanvas.height * pageWidth) / qualityRepCanvas.width;

  pdf.addImage(qualityRepImage, 'PNG', 0, topMargin, pageWidth, qualityRepHeight);
  addPageNumber(pdf, 1, 2);

  pdf.addPage();

  const engineeringSection = document.querySelector('#engineeringSection');
  const engineeringCanvas = await html2canvas(engineeringSection, { backgroundColor: null });
  const engineeringImage = engineeringCanvas.toDataURL('image/png');
  const engineeringHeight = (engineeringCanvas.height * pageWidth) / engineeringCanvas.width;

  pdf.addImage(engineeringImage, 'PNG', 0, topMargin, pageWidth, engineeringHeight);
  addPageNumber(pdf, 2, 2);

  pdf.save('crossfire_ncr.pdf');
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

        var importLabel = document.getElementById("importLabel");
        importLabel.style.display = "none";
        var btnImport = document.getElementById("btnImport");
        btnImport.style.display = "none";
        const submitButton = document.getElementById("btnSubmit");
        const saveButton = document.getElementById("btnSave");
        const clearButton = document.getElementById("btnClear");

        submitButton.value = "Edit NCR";
        submitButton.onclick = function (event) {
          event.preventDefault();
          editNCR(ncrIndex);
          submitButton.value = "Submit NCR";

          submitButton.onclick = function (event) {
            event.preventDefault();
            submitFormData(event);
          };

          saveButton.value = "Save NCR";
          saveButton.onclick = function (event) {
            event.preventDefault();
            saveFormData(event);
          };

          clearButton.value = "Clear";
          clearButton.onclick = function () {
            clearForm();
          };
        };

        saveButton.value = "Print PDF";
        saveButton.onclick = function (event) {
          event.preventDefault();
          printPDF();
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

        initializeForm(currentUserType, currentName, currentDate);

        var importLabel = document.getElementById("importLabel");
        importLabel.style.display = "none";
        var btnImport = document.getElementById("btnImport");
        btnImport.style.display = "none";
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

async function loadPendingNCRs() {
  const pendingNCRs = [];

  let query = firestore.collection("formData");
  if (currentUserType === "Engr") {
    query = query.where("status", "==", "Pending Engr Review");
  } else if (currentUserType === "Admin") {
    query = query.where("status", "in", ["Pending Engr Review", "Pending Purchasing Review"]);
  } else {
    return;
  }

  const snapshot = await query.get();
  snapshot.forEach((doc) => {
    const ncrData = doc.data();
    ncrData.id = doc.id;
    pendingNCRs.push(ncrData);
  });

  pendingNCRs.sort((a, b) => {
    return b.ncrNo - a.ncrNo || new Date(b.qualityRepReportingDate) - new Date(a.qualityRepReportingDate);
  });

  const notificationContainer = document.getElementById("ncrNotificationContainer");
  notificationContainer.innerHTML = "";

  const header = document.createElement("div");
  header.classList.add("notification-header");
  header.textContent = `${currentName}, there are ${pendingNCRs.length} Pending NCRs for your review`;

  header.onclick = () => {
    const ncrListContainer = document.getElementById("ncrListContainer");
    ncrListContainer.classList.toggle("collapsed");
  };

  notificationContainer.appendChild(header);

  const ncrListContainer = document.createElement("div");
  ncrListContainer.id = "ncrListContainer";
  ncrListContainer.classList.add("ncr-list-container");

  pendingNCRs.forEach((ncr) => {
    const ncrItem = document.createElement("div");
    ncrItem.classList.add("ncr-item");

    const localStorageKey = `${currentUsername}-read-${ncr.id}`;
    const isRead = localStorage.getItem(localStorageKey) === "true";

    ncrItem.classList.add(isRead ? "read" : "unread");

    const readButton = document.createElement("button");
    readButton.textContent = isRead ? "Mark Unread" : "Mark Read";
    readButton.classList.add("btnAction");
    readButton.onclick = () => toggleReadStatus(localStorageKey, !isRead, ncrItem, readButton);

    const ncrLink = document.createElement("a");
    ncrLink.href = "#";
    ncrLink.textContent = `NCR #${ncr.ncrNo} - ${ncr.status}`;
    ncrLink.onclick = async () => {

      await toggleReadStatus(localStorageKey, true, ncrItem, readButton);

      await editNCR(ncr.id);
    };

    const ncrDetails = document.createElement("p");
    ncrDetails.textContent = `Product Number: ${ncr.prodNo}, reported on ${ncr.qualityRepReportingDate} by ${ncr.qualityRepName}`;

    ncrItem.appendChild(ncrLink);
    ncrItem.appendChild(ncrDetails);
    ncrItem.appendChild(readButton);

    ncrListContainer.appendChild(ncrItem);
  });

  notificationContainer.appendChild(ncrListContainer);
}

function toggleReadStatus(localStorageKey, isRead, ncrItem, readButton) {
  localStorage.setItem(localStorageKey, isRead.toString());

  ncrItem.classList.toggle("read", isRead);
  ncrItem.classList.toggle("unread", !isRead);
  readButton.textContent = isRead ? "Mark Unread" : "Mark Read";
}

window.onload = loadPendingNCRs;