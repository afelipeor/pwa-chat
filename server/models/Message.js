function toPublicMessage(message) {
  return {
    id: message._id?.toString() || '',
    text: message.text,
    username: message.username,
    userId: message.userId?.toString() || '',
    timestamp: message.timestamp?.toISOString() || '',
    roomId: message.roomId,
    edited: message.edited,
    editedAt: message.editedAt?.toISOString(),
    replyTo: message.replyTo?.toString(),
  };
}

module.exports = {
  toPublicMessage,
};
