const webpush = require('web-push');
require('dotenv').config();

// VAPID 키 설정
webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

module.exports = webpush;
