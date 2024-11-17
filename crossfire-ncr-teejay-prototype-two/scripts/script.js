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

/*Load different pages into the main content area*/
function loadPage(page) {
  const contentArea = document.getElementById('mainContent');
  // const ncrTable = document.getElementById("ncrTable");
  const pageTitle = document.querySelector('.homeSection #pageTitle h1');

  const xhr = new XMLHttpRequest();
  xhr.open('GET', page, true);

  xhr.onload = async function () {
    if (this.status === 200) {
      contentArea.innerHTML = this.responseText;

      // ncrTable.style.display = "none";

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

function toggleAnswer(faqElement) {
  const answer = faqElement.querySelector('.answer');
  answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
}