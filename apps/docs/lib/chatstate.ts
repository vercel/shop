import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const chatOpenAtom = atomWithStorage<boolean>("shop:chat-open", false);

export function useChatState() {
  const [isOpen, setIsOpen] = useAtom(chatOpenAtom);
  return { isOpen, setIsOpen };
}
