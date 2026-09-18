import type { ReactNode } from "react";
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
          <SheetBody title={title}>{children}</SheetBody>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}
