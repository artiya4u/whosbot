const sleep = async (secs) => new Promise(resolve => setTimeout(resolve, secs * 1000));

const affiliate_links = [
    's.shopee',
    's.lazada',
    'shope.ee',
    'shp.ee'
];

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
            let text = reply_elm.querySelector('div[dir="auto"]')?.textContent;
            let sub_content = reply_elm.querySelector('div[aria-labelledby]');
            let sub_link = null;
            let sub_post = null;
            if (sub_content != null) {
                let link_elm = sub_content.querySelector('a');
                if (link_elm != null) {
                    sub_link = link_elm.href;
                }
                sub_post = sub_content.querySelector('div[dir="auto"]');
            }

            let reply = {
                username: username,
                verified: verified,
                reply_elm: reply_elm.parentElement.parentElement.parentElement,
                text: text,
                sub_link: sub_link,
                sub_post: sub_post,
            };
            replies.push(reply);
        } catch (e) {
            console.log('Error parsing reply', e);
        }
    }
    return replies;
}

let sleep_period = 1;
let style_to_hide = 'opacity';
let style_value = '0.10';

let use_hide = false;

let block_emoji = true;
let block_affiliate = true;
let block_sub_post = true;

function check_and_hide_elm(elm) {
    if (elm.style[style_to_hide] !== style_value) {
        elm.style[style_to_hide] = style_value;
    }
}


function check_spam(post_user, replies) {
    const first_reply = replies[0];
    for (let i = 1; i < replies.length; i++) { // skip the post itself
        let reply = replies[i];
        let username = reply.username;
        if (username === first_reply.username) {
            continue;
        }
        if (username === post_user) {
            continue;
        }

        if (reply.verified && username !== post_user) {
            check_and_hide_elm(reply.reply_elm);
            continue;
        }

        // remove none text replies
        if (reply.text === '' && block_emoji) {
            check_and_hide_elm(reply.reply_elm);
            continue;
        }

        // remove affiliate links
        if (block_affiliate) {
            for (let j = 0; j < affiliate_links.length; j++) {
                let affiliate_link = affiliate_links[j];
                if (reply.text.includes(affiliate_link)) {
                    check_and_hide_elm(reply.reply_elm);
                    continue;
                }
            }
        }

        // remove replies with sub link
        if (reply.sub_link != null && block_sub_post) {
            let domain = new URL(reply.sub_link).hostname;
            if (domain !== window.location.hostname) {
                check_and_hide_elm(reply.reply_elm);
                continue;
            }
        }

        // remove replies with sub post
        if (reply.sub_post != null && block_sub_post) {
            console.log('sub post', reply.sub_post);
            check_and_hide_elm(reply.reply_elm);
            continue;
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
        if (username === first_reply.username) {
            continue;
        }
        if (username === post_user) {
            continue;
        }

        let user_rep_list = user_replies[username];
        if (user_rep_list.length > 2) {
            // spam detected remove the replies
            for (let i = 0; i < user_rep_list.length; i++) {
                let reply = user_rep_list[i];
                console.log('spam', reply.reply_elm);
                check_and_hide_elm(reply.reply_elm);
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
    block_emoji = items.emoji;
    block_affiliate = items.affiliate;
    block_sub_post = items.sub_post;
    app_loop().then();
});
