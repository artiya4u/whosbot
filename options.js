// Saves options to chrome.storage
const saveOptions = () => {
    const hide = document.getElementById('hide').checked;

    chrome.storage.sync.set(
        {hide: hide},
        () => {
            // Update status to let user know options were saved.
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            setTimeout(() => {
                status.textContent = '';
            }, 750);
        }
    );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
    chrome.storage.sync.get(
        {hide: false},
        (items) => {
            document.getElementById('hide').checked = items.hide;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);