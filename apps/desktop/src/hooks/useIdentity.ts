import { useEffect, useState } from "react";
import { getOrCreateIdentity, type LocalIdentity } from "../p2p/identity";

type UseIdentityOptions = {
    addMessage: (message: unknown) => void;
};

export function useIdentity({ addMessage }: UseIdentityOptions){
    const [identity, setIdentity] = useState<LocalIdentity | null>(null);

    useEffect(() => {
        async function loadIdentity() {
            try{
                const loaded = await getOrCreateIdentity();
                setIdentity(loaded);

                addMessage({
                    type: "identity.loaded",
                    nickname: loaded.nickname,
                    deviceId: loaded.deviceId,
                    fingerprint: loaded.fingerprint
                });
            }catch(error){
                addMessage({
                    type: "identity.error",
                    error: String(error)
                });
            }
        }

        loadIdentity();
    }, [addMessage]);

    return { identity, setIdentity };
}