const sleep = async (secs) => new Promise(resolve => setTimeout(resolve, secs * 1000));


// on the page load, get all the replies
function parse_replies() {
    let replies_elms = document.querySelectorAll('article');
    let replies = [];
    for (let i = 0; i < replies_elms.length; i++) {
        try {
            let reply_elm = replies_elms[i];
            let user_link_elm = reply_elm.querySelectorAll('a[role="link"]')[1];
            // extract the user from the href e.g. http://x.com/artiya4u
            let username = user_link_elm.href.split('/').pop();
            let verified = reply_elm.querySelector('svg[aria-label="Verified account"]') != null;
            let reply = {
                username: username,
                verified: verified,
                reply_elm: reply_elm.parentElement.parentElement.parentElement,
            };
            replies.push(reply);
        } catch (e) {
        }
    }
    return replies;
}

let sleep_period = 0.100;
let style_to_hide = 'opacity';
let style_value = '0.10';

let use_hide = false;


function check_spam(post_user, replies) {
    const first_reply = replies[0];
    for (let i = 1; i < replies.length; i++) { // skip the post itself
        let reply = replies[i];
        let username = reply.username;
        if (reply.verified && username !== first_reply.username && username !== post_user) {
            // remove the reply element
            if (reply.reply_elm.style[style_to_hide] !== style_value) {
                reply.reply_elm.style[style_to_hide] = style_value;
            }
        }
    }

    let user_replies = {};
    for (let i = 0; i < replies.length; i++) {
        let reply = replies[i];
        if (user_replies[reply.username] == null) {
            user_replies[reply.username] = [];
        }
        user_replies[reply.username].push(reply);
    }
    for (let username in user_replies) {
        let user_rep_list = user_replies[username];
        if (user_rep_list.length > 2 && username !== first_reply.username && username !== post_user) {
            // spam detected remove the replies
            for (let i = 0; i < user_rep_list.length; i++) {
                let reply = user_rep_list[i];
                if (reply.reply_elm.style[style_to_hide] !== style_value) {
                    reply.reply_elm.style[style_to_hide] = style_value;
                }
            }
        }
    }
}

function get_post_user(url) {
    if (url.includes('/status/')) {
        // find username in the url https://x.com/artiya4u/status/1832391147161055680 -> artiya4u
        return url.split('/status/')[0].split('/').pop();
    }
    return null;
}


async function app_loop() {
    let count = 0;
    while (count++ < 1234567890) {
        let post_user = get_post_user(window.location.href);
        if (post_user) {
            let replies = parse_replies();
            check_spam(post_user, replies);
        }
        await sleep(sleep_period);
    }
}

chrome.storage.sync.get(null, function (items) {
    use_hide = items.hide;
    if (use_hide) {
        sleep_period = 3; // slow down the loop, to avoid hitting the rate limit
        style_to_hide = 'display';
        style_value = 'none';
    }
    app_loop().then();
});
