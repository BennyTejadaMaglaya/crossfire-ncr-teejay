/* ===== Declarations ===== */

const firebaseConfig = {
    apiKey: "AIzaSyB_e6IyAr8Yvc9A9X2dbkBsU-PKEu3xPuo",
    authDomain: "crossfire-ncr-teejay.firebaseapp.com",
    projectId: "crossfire-ncr-teejay",
    storageBucket: "crossfire-ncr-teejay.firebasestorage.app",
    messagingSenderId: "101348247074",
    appId: "1:101348247074:web:f2793869fba529612aac7b"
};

firebase.initializeApp(firebaseConfig);
let firestore = firebase.firestore();

let currentDate = new Date().toJSON().slice(0, 10);
const currentName = sessionStorage.getItem('name');
const currentUsername = sessionStorage.getItem('username');
const currentUserType = sessionStorage.getItem('userType');
let currentStatus = null;

const Status = new Map([
    ["Status-1", "Q-Rep Stage"],
    ["Status-2", "Pending Engr Review"],
    ["Status-3", "Engr Stage"],
    ["Status-4", "Pending Purchasing Review"],
    ["Status-5", "Purchasing Stage"],
    ["Status-6", "Closed"],
]);

/* ===== Functions ===== */

async function generateNCRNumber() {
    alert("Generating NCR number...");
    const year = new Date().getFullYear();

    try {
        const snapshot = await firestore.collection("formData")
            .orderBy("ncrNo", "desc")
            .limit(1)
            .get();

        let counter = 1;
        if (!snapshot.empty) {
            const lastNCR = snapshot.docs[0].data().ncrNo;
            const lastCounter = parseInt(lastNCR.split('-')[2], 10);
            counter = lastCounter + 1;
        }

        return `NCR-${year}-${String(counter).padStart(4, '0')}`;
    } catch (error) {
        console.error("Error generating NCR number:", error);
        return `NCR-${year}-0001`;
    }
}

function handleMediaUpload() {
    const fileInput = document.getElementById('mediaUpload');
    const files = fileInput.files;
    const previewContainer = document.getElementById('preview');
    const fileCountElement = document.getElementById('fileCount');

    fileCountElement.textContent = `Total files selected: ${previewContainer.childElementCount + files.length}`;

    Array.from(files).forEach(file => {
        const fileType = file.type;
        const previewWrapper = document.createElement('div');
        previewWrapper.classList.add('preview-wrapper');

        const preview = document.createElement(fileType.startsWith('image') ? 'img' : 'video');

        if (fileType.startsWith('image')) {
            preview.src = URL.createObjectURL(file);
            preview.classList.add('preview-thumbnail');
        } else if (fileType.startsWith('video')) {
            preview.src = URL.createObjectURL(file);
            preview.controls = true;
            preview.classList.add('preview-video');
        }

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('btnRemove');

        removeButton.addEventListener('click', function () {
            previewWrapper.remove();
            fileInput.value = '';
            fileCountElement.textContent = `Total files selected: ${previewContainer.childElementCount}`;
        });

        previewWrapper.appendChild(preview);
        previewWrapper.appendChild(removeButton);
        previewContainer.appendChild(previewWrapper);
    });
}

async function clearForm() {
    alert("Clearing NCR form...");
    document.getElementById("ncrForm").reset();
}

/* ===== Submit NCR ===== */

function validateQuantityFields() {
    const qtyDefective = document.getElementById('qtyDefective');
    const qtyReceived = document.getElementById('qtyReceived');

    if (qtyDefective && qtyReceived) {
        const qtyDefectiveValue = parseFloat(qtyDefective.value);
        const qtyReceivedValue = parseFloat(qtyReceived.value);

        if (qtyDefective.value.trim() === "" || qtyReceived.value.trim() === "") {
            document.getElementById('qtyDefectiveError').innerText = "Quantity Defective and Quantity Received cannot be empty.";
            document.getElementById('qtyDefectiveError').style.display = 'inline';
            qtyDefective.focus();
            valid = false;
        }
        else if (isNaN(qtyDefectiveValue) || isNaN(qtyReceivedValue) || qtyDefectiveValue < 0 || qtyReceivedValue < 0) {
            document.getElementById('qtyDefectiveError').innerText = "Quantity Defective and Quantity Received must be valid numbers and cannot be negative.";
            document.getElementById('qtyDefectiveError').style.display = 'inline';
            qtyDefective.focus();
            valid = false;
        }
        else if (qtyDefectiveValue > qtyReceivedValue) {
            document.getElementById('qtyDefectiveError').innerText = "Quantity Defective should be less than or equal to Quantity Received.";
            document.getElementById('qtyDefectiveError').style.display = 'inline';
            qtyDefective.focus();
            valid = false;
        }
        else if (qtyDefectiveValue === 0 || qtyReceivedValue === 0) {
            document.getElementById('qtyDefectiveError').innerText = "Quantity Defective and Quantity Received must be greater than zero.";
            document.getElementById('qtyDefectiveError').style.display = 'inline';
            qtyDefective.focus();
            valid = false;
        } else {
            document.getElementById('qtyDefectiveError').style.display = 'none';
        }
    }
}

function formatFields() {
    const prodNoElement = document.getElementById('prodNo');
    if (prodNoElement) {
        let prodNo = prodNoElement.value.trim();

        if (!/^PO-/i.test(prodNo)) {
            prodNo = prodNo.replace(/^po/i, 'PO');
        }

        prodNo = prodNo.replace(/\D/g, '');
        if (prodNo.length === 8) {
            prodNo = `PO-${prodNo.substring(0, 4)}-${prodNo.substring(4)}`;
        }

        prodNoElement.value = prodNo;
    }

    const salesOrderNoElement = document.getElementById('salesOrderNo');
    if (salesOrderNoElement) {
        let salesOrderNo = salesOrderNoElement.value.trim();

        if (!/^SO-/i.test(salesOrderNo)) {
            salesOrderNo = salesOrderNo.replace(/^so/i, 'SO');
        }

        salesOrderNo = salesOrderNo.replace(/\D/g, '');
        if (salesOrderNo.length === 8) {
            salesOrderNo = `SO-${salesOrderNo.substring(0, 4)}-${salesOrderNo.substring(4)}`;
        }

        salesOrderNoElement.value = salesOrderNo;
    }
}

function validateForm() {
    const engrFields = [
        { id: 'engineerReportingDate', errorId: 'engineerReportingDateError' },
        { id: 'engineerName', errorId: 'engineerNameError' },
        { id: 'disposition', errorId: 'dispositionError' },
        { name: 'dispositionReview', errorId: 'dispositionReviewError', radio: true }
    ];

    const qRepFields = [
        { id: 'qualityRepReportingDate', errorId: 'qualityRepReportingDateError' },
        { id: 'qualityRepName', errorId: 'qualityRepNameError' },
        { id: 'descriptionDefect', errorId: 'descriptionDefectError' },
        { id: 'qtyDefective', errorId: 'qtyDefectiveError', check: (value) => value < 0 },
        { id: 'qtyReceived', errorId: 'qtyReceivedError', check: (value) => value <= 0 },
        { id: 'salesOrderNo', errorId: 'salesOrderNoError', pattern: /^(SO-?|so-?)?\d{4}-?\d{4}$/i },
        { id: 'prodNo', errorId: 'prodNoError', pattern: /^(PO-?|po-?)?\d{4}-?\d{4}$/i },
        { name: 'markedNonconforming', errorId: 'markedNonconformingError', radio: true },
        { id: 'descriptionItem', errorId: 'descriptionItemError' },
        { id: 'supplierName', errorId: 'supplierNameError' },
        { name: 'processApplicable', errorId: 'processApplicableError', radio: true }
    ];

    const fields = (userType === 'Engr') ? engrFields : qRepFields;

    let valid = true;

    fields.forEach(({ id, name, errorId, check, pattern, radio }) => {
        const element = id ? document.getElementById(id) : document.querySelector(`input[name="${name}"]:checked`);
        const value = element ? element.value : null;
        const error = document.getElementById(errorId);

        validateQuantityFields();

        if (!value || (check && check(value)) || (pattern && !pattern.test(value))) {
            error.style.display = 'inline';

            if (radio) {
                const radioGroup = document.querySelectorAll(`input[name="${name}"]`);
                if (radioGroup.length > 0) {
                    radioGroup[0].focus();
                }
            } else if (id) {
                element.focus();
            }

            valid = false;
        } else {
            error.style.display = 'none';
        }
    });

    formatFields();

    return valid;
}

function collectFormData(ncrNo) {
    if (document.getElementById("closeNCRCheckbox").checked) {
        currentStatus = Status.get("Status-6");
    } else {
        currentStatus = (userType === 'Engr') ? Status.get("Status-4") : Status.get("Status-2");
    }

    const qtyReceived = parseInt(document.getElementById('qtyReceived')?.value) || 0;  // Default to 0 if NaN
    const qtyDefective = parseInt(document.getElementById('qtyDefective')?.value) || 0;  // Default to 0 if NaN

    /* ===== Pending Engr Review ===== */
    if (userType === 'Q-Rep' || userType === 'Admin') {
        return {
            ncrNo,
            status: currentStatus,

            processApplicable: document.querySelector('input[name="processApplicable"]:checked').value,
            supplierName: document.getElementById('supplierName').value,
            descriptionItem: document.getElementById('descriptionItem').value,
            prodNo: document.getElementById('prodNo').value,
            salesOrderNo: document.getElementById('salesOrderNo').value,
            qtyReceived: qtyReceived,
            qtyDefective: qtyDefective,
            descriptionDefect: document.getElementById('descriptionDefect').value,
            markedNonconforming: document.querySelector('input[name="markedNonconforming"]:checked').value,
            qualityRepName: document.getElementById('qualityRepName').value,
            qualityRepReportingDate: document.getElementById('qualityRepReportingDate').value,

            dispositionReview: document.querySelector('input[name="dispositionReview"]:checked')?.value || null,
            customerRequireNotification: document.querySelector('input[name="customerRequireNotification"]:checked')?.value || null,
            disposition: document.getElementById('disposition')?.value || null,
            drawingRequireUpdating: document.querySelector('input[name="drawingRequireUpdating"]:checked')?.value || null,
            originalRevNumber: document.getElementById('originalRevNumber')?.value || null,
            updatedRevNumber: document.getElementById('updatedRevNumber')?.value || null,
            engineerRevisionDate: document.getElementById('engineerRevisionDate')?.value || null,
            engineerName: document.getElementById('engineerName')?.value || null,
            engineerReportingDate: document.getElementById('engineerReportingDate')?.value || null,
        };
    }

    /* ===== Pending Purchasing Review ===== */
    if (userType === 'Engr' || userType === 'Admin') {
        return {
            ncrNo,
            status: currentStatus,

            processApplicable: document.querySelector('input[name="processApplicable"]:checked')?.value || null,
            supplierName: document.getElementById('supplierName')?.value || null,
            descriptionItem: document.getElementById('descriptionItem')?.value || null,
            prodNo: document.getElementById('prodNo')?.value || null,
            salesOrderNo: document.getElementById('salesOrderNo')?.value || null,
            qtyReceived: document.getElementById('qtyReceived')?.value || null,
            qtyDefective: document.getElementById('qtyDefective')?.value || null,
            descriptionDefect: document.getElementById('descriptionDefect')?.value || null,
            markedNonconforming: document.querySelector('input[name="markedNonconforming"]:checked')?.value || null,
            qualityRepName: document.getElementById('qualityRepName')?.value || null,
            qualityRepReportingDate: document.getElementById('qualityRepReportingDate')?.value || null,

            dispositionReview: document.querySelector('input[name="dispositionReview"]:checked').value,
            customerRequireNotification: document.querySelector('input[name="customerRequireNotification"]:checked')?.value || null,
            disposition: document.getElementById('disposition').value,
            drawingRequireUpdating: document.querySelector('input[name="drawingRequireUpdating"]:checked')?.value || null,
            originalRevNumber: document.getElementById('originalRevNumber').value,
            updatedRevNumber: document.getElementById('updatedRevNumber').value,
            engineerRevisionDate: document.getElementById('engineerRevisionDate').value,
            engineerName: document.getElementById('engineerName').value,
            engineerReportingDate: document.getElementById('engineerReportingDate').value,
        };
    }
}

async function checkDuplicateNCR(ncrNo) {
    const snapshot = await firestore.collection("formData").where("ncrNo", "==", ncrNo).get();
    return !snapshot.empty;
}

function saveToFirebase(data) {
    firestore.collection("formData").add(data)
        .then(() => {
            alert("Your form has been submitted successfully with the status: " + currentStatus);
            clearForm();
        })
        .catch((error) => {
            console.error("Error submitting form:", error);
        });
}

function submitFormData(event) {
    event.preventDefault();

    if (!validateForm()) return;

    const userConfirmed = window.confirm("Are you sure you want to submit this form?");

    if (!userConfirmed) {
        return;
    }

    const ncrNo = document.getElementById("ncrNo").value;

    /*If the NCR number is empty, generate a new NCR number (for creating new NCR)*/
    if (!ncrNo) {
        generateNCRNumber().then((generatedNcrNo) => {
            const formData = collectFormData(generatedNcrNo);

            checkDuplicateNCR(generatedNcrNo)
                .then((exists) => {
                    if (exists) {
                        alert("An entry with this NCR Number already exists.");
                    } else {
                        saveToFirebase(formData);
                    }
                })
                .catch((error) => {
                    console.error("Error checking for duplicate:", error);
                });
        });
    } else {
        /*If NCR number exists, it's an edit operation, update the existing document in Firestore*/
        const formData = collectFormData(ncrNo);

        /*Find the document with this NCR number in Firestore and update it*/
        firestore.collection("formData").where("ncrNo", "==", ncrNo).get()
            .then((snapshot) => {
                if (!snapshot.empty) {
                    const docId = snapshot.docs[0].id;
                    firestore.collection("formData").doc(docId).update(formData)
                        .then(() => {
                            alert("Your NCR has been updated successfully with the status: " + currentStatus);
                            loadNCRTable();
                            clearForm();
                        })
                        .catch((error) => {
                            console.error("Error updating document:", error);
                        });
                } else {
                    alert("No NCR found with the given number.");
                }
            })
            .catch((error) => {
                console.error("Error finding NCR for edit:", error);
            });
    }
}

/* ===== Save NCR ===== */

async function saveFormData(event) {
    event.preventDefault();

    const ncrNoElement = document.getElementById("ncrNo");
    let ncrNo = ncrNoElement?.value.trim();

    if (!ncrNo) {
        ncrNo = await generateNCRNumber();
    }

    currentStatus = (userType === 'Engr') ? Status.get("Status-3") : Status.get("Status-1");
    const qtyReceived = parseInt(document.getElementById('qtyReceived')?.value) || 0;  // Default to 0 if NaN
    const qtyDefective = parseInt(document.getElementById('qtyDefective')?.value) || 0;  // Default to 0 if NaN

    const formData = {
        ncrNo,
        status: currentStatus,

        /* ===== Q-Rep Stage ===== */
        processApplicable: document.querySelector('input[name="processApplicable"]:checked')?.value || null,
        supplierName: document.getElementById('supplierName')?.value || null,
        descriptionItem: document.getElementById('descriptionItem')?.value || null,
        prodNo: document.getElementById('prodNo')?.value || null,
        salesOrderNo: document.getElementById('salesOrderNo')?.value || null,
        qtyReceived: qtyReceived,
        qtyDefective: qtyDefective,
        descriptionDefect: document.getElementById('descriptionDefect')?.value || null,
        markedNonconforming: document.querySelector('input[name="markedNonconforming"]:checked')?.value || null,
        qualityRepName: document.getElementById('qualityRepName')?.value || null,
        qualityRepReportingDate: document.getElementById('qualityRepReportingDate')?.value || null,

        /* ===== Engr Stage ===== */
        dispositionReview: document.querySelector('input[name="dispositionReview"]:checked')?.value || null,
        customerRequireNotification: document.querySelector('input[name="customerRequireNotification"]:checked')?.value || null,
        disposition: document.getElementById('disposition')?.value || null,
        drawingRequireUpdating: document.querySelector('input[name="drawingRequireUpdating"]:checked')?.value || null,
        originalRevNumber: document.getElementById('originalRevNumber')?.value || null,
        updatedRevNumber: document.getElementById('updatedRevNumber')?.value || null,
        engineerRevisionDate: document.getElementById('engineerRevisionDate')?.value || null,
        engineerName: document.getElementById('engineerName')?.value || null,
        engineerReportingDate: document.getElementById('engineerReportingDate')?.value || null,
    };

    try {
        if (await checkDuplicateNCR(ncrNo)) {
            const snapshot = await firestore.collection("formData").where("ncrNo", "==", ncrNo).get();
            if (!snapshot.empty) {
                const docId = snapshot.docs[0].id;
                await firestore.collection("formData").doc(docId).update(formData);
                alert("Your form has been updated successfully with the status: " + currentStatus);
            } else {
                alert("An error occurred: Existing NCR could not be found.");
            }
        } else {
            await firestore.collection("formData").add(formData);
            alert("Your form has been saved successfully with the status: " + currentStatus);
        }
        clearForm();
    } catch (error) {
        console.error("Error saving form:", error);
        alert("An error occurred while saving the form. Please try again.");
    }
}

function importExcel(event) {
    var file = event.target.files[0];
    if (file) {
        if (!file.name.match(/\.xlsx?$/)) {
            alert('Please upload a valid Excel file (.xlsx or .xls)');
            return;
        }

        var reader = new FileReader();

        reader.onload = function (e) {
            var data = e.target.result;

            try {
                var workbook = XLSX.read(data, { type: 'binary' });
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error("No sheets found in the Excel file.");
                }

                var sheetName = workbook.SheetNames[0];
                var sheet = workbook.Sheets[sheetName];

                function getCellValue(cellAddress) {
                    return sheet[cellAddress] ? sheet[cellAddress].v : '';
                }

                function setElementValue(id, value, isCheckbox = false) {
                    var element = document.getElementById(id);
                    if (element) {
                        if (isCheckbox) {
                            element.checked = value === "x";
                        } else {
                            element.value = value;
                        }
                    } else {
                        console.warn(`Element with ID '${id}' not found.`);
                    }
                }

                setElementValue("processApplicable1", getCellValue("C6"), true);
                setElementValue("processApplicable2", getCellValue("C7"), true);
                setElementValue("supplierName", getCellValue("M7"));
                setElementValue("descriptionItem", getCellValue("B9"));
                setElementValue("ncrNo", getCellValue("AC5"));
                setElementValue("prodNo", getCellValue("AC6"));
                setElementValue("salesOrderNo", getCellValue("AC7"));
                setElementValue("qtyReceived", getCellValue("AF8"));
                setElementValue("qtyDefective", getCellValue("AF9"));
                setElementValue("descriptionDefect", getCellValue("B11"));
                setElementValue("markedNonconformingYes", getCellValue("C15"), true);
                setElementValue("markedNonconformingNo", getCellValue("H15"), true);
                setElementValue("qualityRepName", getCellValue("U16"));

                var qualityRepReportingDate = processDate(sheet['AE16'] ? sheet['AE16'].v : "");
                document.getElementById("qualityRepReportingDate").value = qualityRepReportingDate;

                setElementValue("dispositionReview1", getCellValue("F18"), true);
                setElementValue("dispositionReview2", getCellValue("M18"), true);
                setElementValue("dispositionReview3", getCellValue("T18"), true);
                setElementValue("dispositionReview4", getCellValue("AA18"), true);
                setElementValue("customerRequireNotificationYes", getCellValue("T19"), true);
                setElementValue("customerRequireNotificationNo", getCellValue("AA19"), true);
                setElementValue("disposition", getCellValue("B22"));
                setElementValue("drawingRequireUpdatingYes", getCellValue("O26"), true);
                setElementValue("drawingRequireUpdatingNo", getCellValue("T26"), true);
                setElementValue("originalRevNumber", getCellValue("J27"));
                setElementValue("updatedRevNumber", getCellValue("T27"));
                
                var engineerRevisionDate = processDate(sheet['T28'] ? sheet['T28'].v : "");
                document.getElementById("engineerRevisionDate").value = engineerRevisionDate;

                setElementValue("engineerName", getCellValue("T29"));

                var engineerReportingDate = processDate(sheet['AD29'] ? sheet['AD29'].v : "");
                document.getElementById("engineerReportingDate").value = engineerReportingDate;

            } catch (err) {
                console.error("Error reading the Excel file:", err);
                alert("There was an error processing the Excel file.");
            }
        };

        reader.readAsBinaryString(file);
    }
}

function processDate(value) {
    if (typeof value === "number") {
        // Convert Excel serial date to ISO format
        var excelStartDate = new Date(1900, 0, 1); // Jan 1, 1900
        var daysOffset = value - 2; // Adjust for Excel leap year bug
        var date = new Date(excelStartDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0]; // yyyy-MM-dd
    } else if (typeof value === "string") {
        // Parse MM/DD/YYYY format
        var dateParts = value.split("/");
        if (dateParts.length === 3) {
            var month = parseInt(dateParts[0], 10) - 1; // Months are zero-based
            var day = parseInt(dateParts[1], 10);
            var year = parseInt(dateParts[2], 10);

            var formattedDate = new Date(year, month, day);
            if (!isNaN(formattedDate)) {
                return formattedDate.toISOString().split('T')[0]; // yyyy-MM-dd
            }
        }
        // Attempt direct parsing for other string formats
        var parsedDate = new Date(value);
        if (!isNaN(parsedDate)) {
            return parsedDate.toISOString().split('T')[0];
        }
    }
    console.warn("Invalid date value:", value);
    return "";
}
