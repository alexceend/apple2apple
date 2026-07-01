import { useState } from "react";
import { addFriend, getFriends } from "../p2p/friends";
import { parseInviteLink } from "../p2p/identity";
import type { Friend } from "../p2p/friends";


type FriendsPanelProps = {
  addMessage: (message: unknown) => void;
  selectedFriend: Friend | null;
  onSelectFriend: (friend: Friend) => void;
};

export function FriendsPanel({ addMessage, selectedFriend, onSelectFriend }: FriendsPanelProps) {
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
            <button onClick={() => onSelectFriend(friend)}>
                {selectedFriend?.fingerprint === friend.fingerprint ? "✅ " : ""}
                {friend.nickname}
            </button>
            {" — "}
            {friend.fingerprint}
            </li>
        ))}
      </ul>
    </section>
  );
}