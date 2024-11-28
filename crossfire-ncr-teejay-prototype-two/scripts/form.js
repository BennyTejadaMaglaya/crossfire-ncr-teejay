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
const currentUsername = sessionStorage.getItem('name');
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
    currentStatus = (userType === 'Engr') ? Status.get("Status-4") : Status.get("Status-2");

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
            qtyReceived: document.getElementById('qtyReceived').value,
            qtyDefective: document.getElementById('qtyDefective').value,
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

    const formData = {
        ncrNo,
        status: currentStatus,

        /* ===== Q-Rep Stage ===== */
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
