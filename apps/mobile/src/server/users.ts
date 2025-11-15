import users from "@/assets/stubs/users.json";

export const list = () => {
  return users;
};

export type Type = (typeof users)[number];

/**
 * Format friends for AI prompt
 */
export const promptify = (friends: Type[]): string => {
  const list = friends
    .map(
      (friend) =>
        `- userId: ${friend.id} | Name: ${
          friend.name
        } | Preferences: ${friend.preferences.join(
          ", "
        )} | Common Orders: ${friend.commonOrders.join(", ")}`
    )
    .join("\n");

  const valid = friends.map((friend) => friend.id).join(", ");
  const examples = friends
    .slice(0, 3)
    .map((friend) => friend.id)
    .join(", ");

  return `
  ## Available Friends (SELECT userIds FROM THIS LIST ONLY):
  
  VALID userIds format examples: ${examples}
  ALL valid userIds: ${valid}
  
  LIST: ${list}
  
  IMPORTANT: You MUST use the exact userId strings from the list above (e.g., "friend_001", "friend_002"). Do NOT create new userIds.
  `;
};

type Get = {
  (input: string): Type;
  (input: string[]): Type[];
};
export const get = ((input) => {
  const all = list();

  const isArray = Array.isArray(input);
  const ids = isArray ? input : [input];

  const selected = ids.map((id) => {
    const item = all.find((item) => item.id === id);
    if (!item) throw new Error(`Friend with id ${id} not found`);

    return item;
  });

  return isArray ? selected : selected[0]!;
}) as Get;
