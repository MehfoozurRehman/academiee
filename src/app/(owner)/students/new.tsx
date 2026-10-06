import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  Button,
  Card,
  DateField,
  EmptyState,
  Input,
  Reveal,
  Screen,
  Segmented,
  Select,
  Skeleton,
  Text,
  useToast,
} from "../../../components/ui";
import { useAcademyId } from "../../../context/AcademyContext";
import { useI18n } from "../../../i18n/I18nProvider";
import { errorMessage } from "../../../lib/errors";
import { useToday } from "../../../lib/useToday";
import { space } from "../../../theme/tokens";

const PHONE_RE = /^[0-9+\-\s]{7,16}$/;
const digits = (s: string) => s.replace(/\D/g, "");

export default function NewStudent() {
  const { t, money } = useI18n();
  const toast = useToast();
  const academyId = useAcademyId();
  const { today } = useToday();

  const batches = useQuery(api.classes.listBatches, { academyId });
  const create = useMutation(api.students.create);

  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [parentPhone, setParentPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [batchId, setBatchId] = useState<string | null>(null);
  const [fee, setFee] = useState("");
  const [feeTouched, setFeeTouched] = useState(false);
  const [admissionDate, setAdmissionDate] = useState(today);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(
    () =>
      (batches ?? []).map((b) => {
        const full = b.enrolled >= b.capacity;
        return {
          value: b._id as string,
          label: `${b.name} · ${b.courseName} · ${b.enrolled}/${b.capacity}`,
          hint: full ? t("students.batchFullHint", { course: b.courseName, capacity: b.capacity }) : t("students.batchHint", { course: b.courseName, enrolled: b.enrolled, capacity: b.capacity }),
        };
      }),
    [batches, t]
  );

  function pickBatch(id: string) {
    const b = batches?.find((x) => x._id === id);
    if (!b) return;
    if (b.enrolled >= b.capacity) {
      setErrors((e) => ({ ...e, batch: t("students.batchFull") }));
      return;
    }
    setErrors((e) => ({ ...e, batch: "" }));
    setBatchId(id);
    if (!feeTouched) setFee(String(b.courseFee));
  }

  async function submit() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = t("students.errName");
    if (fatherName.trim().length < 2) next.fatherName = t("students.errFather");
    if (!PHONE_RE.test(parentPhone.trim())) next.parentPhone = t("students.errParentPhone");
    if (phone.trim() && !PHONE_RE.test(phone.trim())) next.phone = t("students.errStudentPhone");
    if (!batchId) next.batch = t("students.errBatch");
    if (fee === "") next.fee = t("students.errFee");
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const res = await create({
        academyId,
        batchId: batchId as Id<"batches">,
        name,
        fatherName,
        gender,
        parentPhone,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        monthlyFee: Number(fee),
        admissionDate,
      });
      toast(t("students.added", { name: name.trim() }));
      router.replace(`/students/${res.studentId}` as never);
    } catch (e) {
      setFormError(errorMessage(e, t("common.somethingWrong")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen narrow back="/students" title={t("students.add")} subtitle={t("students.newSubtitle")}>
      {batches === undefined ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
        </View>
      ) : batches.length === 0 ? (
        <EmptyState
          icon="layers"
          title={t("students.noBatches")}
          body={t("students.noBatchesBody")}
          action={<Button label={t("students.goToClasses")} onPress={() => router.push("/classes" as never)} />}
        />
      ) : (
        <View style={{ gap: space.xl }}>
          <Reveal index={0}>
            <Card style={{ gap: space.lg }}>
              <Input
                label={t("students.name")}
                value={name}
                onChangeText={setName}
                error={errors.name}
                autoCapitalize="words"
                maxLength={80}
              />
              <Input
                label={t("students.fatherName")}
                value={fatherName}
                onChangeText={setFatherName}
                error={errors.fatherName}
                autoCapitalize="words"
                maxLength={80}
              />
              <View style={{ gap: space.xs + 2 }}>
                <Text variant="label" color="textMuted">
                  {t("students.gender")}
                </Text>
                <Segmented
                  value={gender}
                  onChange={setGender}
                  options={[
                    { value: "male", label: t("students.male") },
                    { value: "female", label: t("students.female") },
                  ]}
                />
              </View>
            </Card>
          </Reveal>

          <Reveal index={1}>
            <Card style={{ gap: space.lg }}>
              <Input
                latin
                label={t("students.parentPhone")}
                hint={t("students.parentPhoneHint")}
                value={parentPhone}
                onChangeText={setParentPhone}
                error={errors.parentPhone}
                keyboardType="phone-pad"
                maxLength={16}
                placeholder="0300 1234567"
              />
              <Input
                latin
                label={`${t("students.studentPhone")} · ${t("common.optional")}`}
                value={phone}
                onChangeText={setPhone}
                error={errors.phone}
                keyboardType="phone-pad"
                maxLength={16}
              />
              <Input
                label={`${t("students.address")} · ${t("common.optional")}`}
                value={address}
                onChangeText={setAddress}
                maxLength={200}
              />
            </Card>
          </Reveal>

          <Reveal index={2}>
            <Card style={{ gap: space.lg }}>
              <Select
                label={t("students.batch")}
                placeholder={t("students.selectBatch")}
                value={batchId}
                options={options}
                onChange={pickBatch}
                error={errors.batch}
              />
              <Input
                latin
                label={t("students.monthlyFee")}
                hint={batchId ? t("students.monthlyFeeHint") : undefined}
                value={fee}
                onChangeText={(v) => {
                  setFeeTouched(true);
                  setFee(digits(v).slice(0, 8));
                }}
                error={errors.fee}
                keyboardType="number-pad"
              />
              {fee !== "" ? (
                <Text variant="caption" color="textMuted" latin>
                  {money(Number(fee))}
                </Text>
              ) : null}
              <DateField label={t("students.admissionDate")} value={admissionDate} onChange={setAdmissionDate} />
            </Card>
          </Reveal>

          {formError ? (
            <Text variant="caption" color="danger">
              {formError}
            </Text>
          ) : null}
          <Button full size="lg" label={t("students.save")} loading={saving} onPress={submit} />
        </View>
      )}
    </Screen>
  );
}
