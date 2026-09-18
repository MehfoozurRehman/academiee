export type FormField = {
  key: string;
  label: string;
  placeholder?: string;
  keyboard?: "default" | "email-address" | "numeric" | "phone-pad";
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
};

export type FormChoice = {
  key: string;
  label: string;
  options: { label: string; value: string }[];
};

export type FormSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  choices?: FormChoice[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  submitLabel: string;
  onSubmit: () => void;
  busy?: boolean;
  error?: string;
  note?: string;
};
