function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    includeTopSites: document.querySelector("#include-top-sites").checked,
    foldersToExclude: (document.querySelector("#folders-to-exclude").value || '').split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0)
  });
}

function restoreOptions() {
  browser.storage.local.get().then((x) => {
    document.querySelector("#include-top-sites").checked = x.includeTopSites;
    document.querySelector("#folders-to-exclude").value = x.foldersToExclude.join('\n');
  }, (error) => {
    console.log(`Error: ${error}`);
  });

  document.querySelector('#container').style.display = 'block'
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);