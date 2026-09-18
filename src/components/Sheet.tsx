import type { ReactNode } from "react";
import { Modal, Pressable, View } from "react-native";
import { useTheme } from "../theme";
import { SheetBody } from "./SheetBody";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const t = useTheme();

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#00000066", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            borderTopLeftRadius: t.radius.lg + 8,
            borderTopRightRadius: t.radius.lg + 8,
            overflow: "hidden",
          }}
        >
          <SheetBody title={title} showHandle>
            {children}
          </SheetBody>
        </View>
      </View>
    </Modal>
  );
}
