import User from '../../models/user';

export const updateUserActivityTime = async (
    userId: string,
    activityTime: number
): Promise<void> => {
  try {
    await User.findByIdAndUpdate(
        userId,
        {lastActivity: activityTime},
        {new: true}
    );
  } catch {
    throw new Error;
  }
}

export const getUserLastActivity = async (
    userId: string
): Promise<Date> => {
  try {
    const user = await User.findById(userId).select('lastActivity');
    return user.lastActivity;
  } catch {
    throw new Error;
  }
}