function toPublicUser(user) {
  return {
    id: user._id?.toString() || '',
    username: user.username,
    email: user.email,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
  };
}

module.exports = {
  toPublicUser,
};
