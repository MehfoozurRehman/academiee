import type { ReactNode } from "react";
import { Dimensions, View } from "react-native";
import { Host, ModalBottomSheet, RNHostView } from "@expo/ui/jetpack-compose";
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

  if (!open) return null;

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <ModalBottomSheet
        onDismissRequest={onClose}
        containerColor={t.colors.bg}
        showDragHandle
        skipPartiallyExpanded
      >
        <RNHostView matchContents>
          <View style={{ width: Dimensions.get("window").width }}>
            <SheetBody title={title}>{children}</SheetBody>
          </View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
