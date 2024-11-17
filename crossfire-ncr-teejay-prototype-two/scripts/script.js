/* ===== Declarations ===== */

let currentDate = new Date().toJSON().slice(0, 10);

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
  sidebar.classList.toggle("open");
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

function loadPage(page) {
  const contentArea = document.getElementById('mainContent');
  const ncrTable = document.getElementById("ncrTable");
  const pageTitle = document.querySelector('.homeSection #pageTitle h1');

  const xhr = new XMLHttpRequest();
  xhr.open('GET', page, true);

  xhr.onload = async function () {
    if (this.status === 200) {
      contentArea.innerHTML = this.responseText;

      ncrTable.style.display = "none";

      switch (page) {
        case 'index.html':
          pageTitle.textContent = 'Dashboard';
          break;

        case 'view.html':
          pageTitle.textContent = 'View NCRs';
          break;

        case 'ncr-form.html':
          pageTitle.textContent = 'NCR Form';
          document.getElementById('qualityRepReportingDate').value = currentDate;
          document.getElementById('engineerRevisionDate').value = currentDate;
          document.getElementById('engineerReportingDate').value = currentDate;
          document.getElementById('processApplicable1').focus();
          break;

        case 'faqs.html':
          pageTitle.textContent = 'FAQs';
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

async function viewNCR(ncrIndex) {
  const ncrRef = firestore.collection("formData").doc(ncrIndex.toString());
  try {
    const doc = await ncrRef.get();
    if (doc.exists) {
      const ncrData = doc.data();
      loadPage("ncr-form.html");

      setTimeout(() => {
        document.querySelectorAll('input[name="processApplicable"]').forEach((radio) => {
          if (radio.value === ncrData.processApplicable) {
            radio.checked = true;
          }
        });

        document.getElementById('supplierName').value = ncrData.supplierName;
        document.getElementById('descriptionItem').value = ncrData.descriptionItem;

        document.querySelectorAll('input[name="markedNonconforming"]').forEach((radio) => {
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
        document.getElementById('engineerName').value = ncrData.engineerName;
        document.getElementById('engineerReportingDate').value = ncrData.engineerReportingDate;

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
        document.querySelectorAll('input[name="processApplicable"]').forEach((radio) => {
          radio.disabled = false;
          if (radio.value === ncrData.processApplicable) {
            radio.checked = true;
          }
        });

        document.getElementById('supplierName').value = ncrData.supplierName;
        document.getElementById('descriptionItem').value = ncrData.descriptionItem;

        document.querySelectorAll('input[name="markedNonconforming"]').forEach((radio) => {
          radio.disabled = false;
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
        document.getElementById('engineerRevisionDate').value = ncrData.engineerRevisionDate;
        document.getElementById('engineerName').value = ncrData.engineerName;
        document.getElementById('engineerReportingDate').value = ncrData.engineerReportingDate;
      }, 100);
    }
  } catch (error) {
    console.error("Error getting NCR data:", error);
  }
}

let currentSortColumn = 'ncrNo';
let currentSortOrder = 'desc';

async function loadNCRTable() {
  const tableBody = document.querySelector("#ncrTable tbody");
  tableBody.innerHTML = "";

  try {
    const snapshot = await firestore.collection("formData").get();

    const ncrDataArray = [];

    snapshot.forEach((doc) => {
      const ncrData = doc.data();
      ncrData.id = doc.id;
      ncrDataArray.push(ncrData);
    });

    sortData(ncrDataArray, currentSortColumn, currentSortOrder);

    ncrDataArray.forEach((ncrData) => {
      const row = document.createElement("tr");
      row.dataset.docId = ncrData.id;

      row.innerHTML = `
              <td>${ncrData.ncrNo}</td>
              <td>${ncrData.supplierName}</td>
              <td>${ncrData.qualityRepReportingDate}</td>
              <td>${ncrData.status}</td>
              <td>
                  <button class="viewBtn">View</button>
                  <button class="editBtn">Edit</button>
                  <button class="deleteBtn">Delete</button>
              </td>
          `;

      tableBody.appendChild(row);
    });

    attachEventListeners();

  } catch (error) {
    console.error("Error loading NCR table:", error);
  }
}

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
  document.getElementById("ncrTable").style.display = "table";
  window.onload = function () {
    loadNCRTable();
  };
} else {
  document.getElementById("ncrTable").style.display = "none";
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