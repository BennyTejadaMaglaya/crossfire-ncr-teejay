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

async function clearForm() {
    alert("Clearing NCR form...");
    document.getElementById("ncrForm").reset();
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
    const fields = [
        { id: 'reportingDateEngineering', errorId: 'reportingDateEngineeringError' },
        { id: 'engineering', errorId: 'engineeringError' },
        { id: 'disposition', errorId: 'dispositionError' },
        { name: 'dispositionReview', errorId: 'dispositionReviewError', radio: true },
        { id: 'reportingDate', errorId: 'reportingDateError' },
        { id: 'lastName', errorId: 'lastNameError' },
        { id: 'firstName', errorId: 'firstNameError' },
        { name: 'markedNonconforming', errorId: 'markedNonconformingError', radio: true },
        { id: 'descriptionDefect', errorId: 'descriptionDefectError' },
        { id: 'qtyDefective', errorId: 'qtyDefectiveError', check: (value) => value < 0 },
        { id: 'qtyReceived', errorId: 'qtyReceivedError', check: (value) => value <= 0 },
        { id: 'salesOrderNo', errorId: 'salesOrderNoError', pattern: /^(SO-?|so-?)?\d{4}-?\d{4}$/i },
        { id: 'prodNo', errorId: 'prodNoError', pattern: /^(PO-?|po-?)?\d{4}-?\d{4}$/i },
        { id: 'descriptionItem', errorId: 'descriptionItemError' },
        { id: 'supplierName', errorId: 'supplierNameError' },
        { name: 'processApplicable', errorId: 'processApplicableError', radio: true }
    ];

    let valid = true;

    fields.forEach(({ id, name, errorId, check, pattern, radio }) => {
        const element = id ? document.getElementById(id) : document.querySelector(`input[name="${name}"]:checked`);
        const value = element ? element.value : null;
        const error = document.getElementById(errorId);

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

    return valid;
}

function collectFormData(ncrNo) {
    return {
        ncrNo,
        processApplicable: document.querySelector('input[name="processApplicable"]:checked').value,
        supplierName: document.getElementById('supplierName').value,
        descriptionItem: document.getElementById('descriptionItem').value,
        prodNo: document.getElementById('prodNo').value,
        salesOrderNo: document.getElementById('salesOrderNo').value,
        qtyReceived: document.getElementById('qtyReceived').value,
        qtyDefective: document.getElementById('qtyDefective').value,
        descriptionDefect: document.getElementById('descriptionDefect').value,
        markedNonconforming: document.querySelector('input[name="markedNonconforming"]:checked').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        reportingDate: document.getElementById('reportingDate').value,
        status: document.getElementById('status').value,
        dispositionReview: document.querySelector('input[name="dispositionReview"]:checked').value,
        customerRequireNotification: document.querySelector('input[name="customerRequireNotification"]:checked')?.value || null,
        disposition: document.getElementById('disposition').value,
        drawingRequireUpdating: document.querySelector('input[name="drawingRequireUpdating"]:checked')?.value || null,
        originalRevNumber: document.getElementById('originalRevNumber').value,
        updatedRevNumber: document.getElementById('updatedRevNumber').value,
        engineerName: document.getElementById('engineerName').value,
        revisionDateEngineering: document.getElementById('revisionDateEngineering').value,
        engineering: document.getElementById('engineering').value,
        reportingDateEngineering: document.getElementById('reportingDateEngineering').value,
    };
}

async function checkDuplicateNCR(ncrNo) {
    const snapshot = await firestore.collection("formData").where("ncrNo", "==", ncrNo).get();
    return !snapshot.empty;
}

function saveToFirebase(data) {
    firestore.collection("formData").add(data)
        .then(() => {
            alert("Your form has been submitted successfully.");
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
                            alert("Your NCR has been updated successfully.");
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
        removeButton.classList.add('remove-button');

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