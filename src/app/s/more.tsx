import { View } from "react-native";
import { router } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Card, ListGroup, ListRow, Reveal, Screen, Section, Segmented, Text, Icon } from "../../components/ui";
import { useMe } from "../../context/AcademyContext";
import { useI18n } from "../../i18n/I18nProvider";
import { useTheme, type ThemePreference } from "../../theme/ThemeProvider";
import { space } from "../../theme/tokens";

export default function StudentMore() {
  const { t, lang, setLang } = useI18n();
  const { preference, setPreference } = useTheme();
  const me = useMe();
  const { signOut } = useAuthActions();

  return (
    <Screen title={t("portal.moreTitle")} subtitle={t("portal.moreSubtitle")} narrow>
      <Reveal index={0}>
        {me?.student ? (
          <Section>
            <Card style={{ gap: 2 }}>
              <Text weight="semibold">{me.student.name}</Text>
              <Text variant="caption" color="textMuted">
                {me.student.academyName}
              </Text>
              <Text latin variant="caption" color="textFaint">
                {t("portal.studentId")}: {me.student.code}
              </Text>
            </Card>
          </Section>
        ) : null}
      </Reveal>
      <Reveal index={1}>
        <Section>
          <ListGroup>
            <ListRow leading={<Icon name="calendar" size={20} color="accent" />} title={t("nav.timetable")} onPress={() => router.push("/s/timetable")} />
            <ListRow leading={<Icon name="bell" size={20} color="accent" />} title={t("nav.notices")} onPress={() => router.push("/s/notices")} />
          </ListGroup>
        </Section>
      </Reveal>
      <Reveal index={2}>
        <Section title={t("settings.language")}>
          <Segmented
            value={lang}
            onChange={setLang}
            options={[
              { value: "en", label: t("settings.english") },
              { value: "ur", label: t("settings.urdu") },
            ]}
          />
        </Section>
      </Reveal>
      <Reveal index={3}>
        <Section title={t("settings.theme")}>
          <Segmented<ThemePreference>
            value={preference}
            onChange={setPreference}
            options={[
              { value: "system", label: t("settings.system") },
              { value: "light", label: t("settings.light") },
              { value: "dark", label: t("settings.dark") },
            ]}
          />
        </Section>
      </Reveal>
      <Reveal index={4}>
        <View style={{ gap: space.sm }}>
          <Button variant="secondary" full icon="log-out" label={t("settings.signOut")} onPress={() => void signOut().then(() => router.replace("/welcome"))} />
          <Text variant="caption" color="textFaint" align="center">
            {t("portal.signOutConfirm")}
          </Text>
        </View>
      </Reveal>
    </Screen>
  );
}
