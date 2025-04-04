import User from '../../models/user';

async function updateUserActivityTime(userId, activityTime) {
  try {
    return await User.findByIdAndUpdate(
        userId,
        {lastActivity: activityTime},
        {new: true}
    );
  } catch (error) {
    throw new Error;
  }
}

async function getUserLastActivity(userId) {
  try {
    const user = await User.findById(userId).select('lastActivity');
    return user.lastActivity;
  } catch (error) {
    throw new Error;
  }
}

module.exports = { updateUserActivityTime, getUserLastActivity };
