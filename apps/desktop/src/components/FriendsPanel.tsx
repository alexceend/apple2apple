import { useState } from "react";
import { addFriend, getFriends } from "../p2p/friends";
import { parseInviteLink } from "../p2p/identity";

type FriendsPanelProps = {
  addMessage: (message: unknown) => void;
};

export function FriendsPanel({ addMessage }: FriendsPanelProps) {
  const [link, setLink] = useState("");
  const [friends, setFriends] = useState(getFriends());

  return (
    <section style={{ marginBottom: 24 }}>
      <h2>Amigos</h2>

      <textarea
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="Pega aquí un link apple2apple://friend/..."
        style={{ width: "100%", minHeight: 80 }}
      />

      <button
        onClick={() => {
          try {
            const friend = parseInviteLink(link);
            addFriend(friend);
            setFriends(getFriends());
            setLink("");

            addMessage({
              type: "friend.added",
              nickname: friend.nickname,
              fingerprint: friend.fingerprint
            });
          } catch (error) {
            addMessage({
              type: "friend.add.error",
              error: String(error)
            });
          }
        }}
      >
        Añadir amigo
      </button>

      <ul>
        {friends.map((friend) => (
          <li key={friend.fingerprint}>
            <strong>{friend.nickname}</strong> — {friend.fingerprint}
          </li>
        ))}
      </ul>
    </section>
  );
}