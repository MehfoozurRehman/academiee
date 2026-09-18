import type { ReactNode } from "react";
import { BottomSheet, Host, RNHostView } from "@expo/ui/swift-ui";
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
  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={open}
        onIsPresentedChange={(presented) => {
          if (!presented) onClose();
        }}
        fitToContents
      >
        <RNHostView matchContents>
          <SheetBody title={title}>{children}</SheetBody>
        </RNHostView>
      </BottomSheet>
    </Host>
  );
}
