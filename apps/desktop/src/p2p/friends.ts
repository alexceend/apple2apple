export type Friend = {
    nickname: string;
    publicKeyJwk: JsonWebKey;
    fingerprint: string;
};

const FRIENDS_KEY = "apple2apple.friends";

export function getFriends(): Friend[]{
    const stored = localStorage.getItem(FRIENDS_KEY);

    if(!stored){
        return [];
    }

    return JSON.parse(stored);
}

export function addFriend(friend: Friend){
    const friends = getFriends();

    if(
        friends.some(
            f => f.fingerprint == friend.fingerprint
        )
    ){
        return;
    }

    friends.push(friend);

    localStorage.setItem(
        FRIENDS_KEY,
        JSON.stringify(friends)
    );
}


export function isFriend(
    fingerprint: string
){
    return getFriends().some(
        f => f.fingerprint == fingerprint
    );
}