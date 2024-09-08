// Saves options to chrome.storage
const saveOptions = () => {
    const hide = document.getElementById('hide').checked;
    const emoji = document.getElementById('emoji').checked;
    const affiliate = document.getElementById('affiliate').checked;
    const sub_post = document.getElementById('sub_post').checked;

    chrome.storage.sync.set(
        {hide: hide, emoji: emoji, affiliate: affiliate, sub_post: sub_post},
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
        {hide: false, emoji: false, affiliate: false, sub_post: false},
        (items) => {
            document.getElementById('hide').checked = items.hide;
            document.getElementById('emoji').checked = items.emoji;
            document.getElementById('affiliate').checked = items.affiliate;
            document.getElementById('sub_post').checked = items.sub_post;
        }
    );
};

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);