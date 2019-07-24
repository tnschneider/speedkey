function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    includeTopSites: document.querySelector("#include-top-sites").checked
  });
}

function restoreOptions() {
  browser.storage.local.get("includeTopSites").then((x) => {
    document.querySelector("#include-top-sites").checked = x.includeTopSites;
  }, (error) => {
    console.log(`Error: ${error}`);
  });

  document.querySelector('#container').style.display = 'block'
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);