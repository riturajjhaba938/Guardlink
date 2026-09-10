const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    console.log(`Push token ${pushToken} is missing or not a valid Expo push token - skipping push message`);
    return;
  }

  const messages = [
    {
      to: pushToken,
      sound: "default",
      title,
      body,
      data,
    },
  ];

  try {
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Push Ticket:", ticketChunk);
    }
  } catch (error) {
    console.error("Error sending push notification", error);
  }
};

module.exports = { sendPushNotification };
