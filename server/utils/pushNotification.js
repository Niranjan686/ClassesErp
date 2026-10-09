const NotificationLog = require('../models/NotificationLog');

/**
 * Send and log push notification to student & parent
 */
async function sendPushNotification({
  instituteId,
  studentId,
  recipientName,
  recipientPhone,
  title,
  message,
  triggerEvent = 'Attendance_Present',
  pushToken,
  data = {},
}) {
  let pushStatus = 'Sent';

  // 1. Send via Expo Push Service using native fetch
  if (pushToken && pushToken.startsWith('ExponentPushToken')) {
    try {
      if (typeof fetch !== 'undefined') {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pushToken,
            sound: 'default',
            title: title || 'Attendance Update',
            body: message,
            data: { ...data, triggerEvent },
            priority: 'high',
            channelId: 'attendance',
          }),
        });
      }
      pushStatus = 'Delivered';
    } catch (err) {
      console.warn('Expo Push dispatch error:', err.message);
      pushStatus = 'Simulated';
    }
  } else {
    pushStatus = 'Simulated';
  }

  // 2. Persist in Database Notification Logs
  try {
    const log = new NotificationLog({
      instituteId,
      studentId,
      recipientType: 'Parent',
      recipientName: recipientName || 'Parent / Student',
      recipientPhone: recipientPhone || '',
      type: 'Push',
      title: title || 'Attendance Verified ✅',
      subject: title || 'Attendance Verified ✅',
      message,
      triggerEvent,
      status: pushStatus,
      data,
    });
    await log.save();
    return log;
  } catch (err) {
    console.error('Failed to log push notification:', err);
    return null;
  }
}

module.exports = {
  sendPushNotification,
};
