import { useRef, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "../context/session";
import { useTheme } from "../theme";
import { AppText, Button } from "../components/ui";
import { Icon, type IconName } from "../components/Icon";
import { Wordmark } from "../components/Wordmark";

const SLIDES: {
  icon: IconName;
  title: string;
  body: string;
}[] = [
  {
    icon: "students",
    title: "Every student in one place",
    body: "Admissions, batches, parent numbers and history — searchable in a second instead of scrolling a spreadsheet.",
  },
  {
    icon: "fees",
    title: "Fees that chase themselves",
    body: "Generate a month of invoices in one tap. See at a glance who is paid, partial, due or overdue.",
  },
  {
    icon: "attendance",
    title: "Attendance in under a minute",
    body: "Mark a whole batch present, late or absent from one screen, and watch the percentages update themselves.",
  },
];

export default function Onboarding() {
  const t = useTheme();
  const { completeOnboarding } = useSession();
  const { width } = Dimensions.get("window");
  const scroller = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  async function finish() {
    await completeOnboarding();
    router.replace("/login");
  }

  function next() {
    if (page >= SLIDES.length - 1) {
      finish();
      return;
    }
    const target = page + 1;
    setPage(target);
    scroller.current?.scrollTo({ x: target * width, animated: true });
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ paddingTop: 72, paddingHorizontal: t.spacing.lg }}>
        <Wordmark />
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={{ flexGrow: 0 }}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.title}
            style={{
              width,
              paddingHorizontal: t.spacing.xl,
              paddingTop: t.spacing.xxl,
              gap: t.spacing.lg,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: t.radius.lg + 6,
                backgroundColor: t.colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={slide.icon} size={34} color={t.colors.accent} />
            </View>

            <AppText variant="display">{slide.title}</AppText>
            <AppText variant="body" color={t.colors.textMuted}>
              {slide.body}
            </AppText>
          </View>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }} />

      <View style={{ padding: t.spacing.xl, gap: t.spacing.lg }}>
        <View style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
          {SLIDES.map((s, i) => (
            <View
              key={s.title}
              style={{
                width: i === page ? 22 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === page ? t.colors.accent : t.colors.border,
              }}
            />
          ))}
        </View>

        <Button
          label={page >= SLIDES.length - 1 ? "Get started" : "Next"}
          onPress={next}
        />
        {page < SLIDES.length - 1 ? (
          <Button label="Skip" variant="ghost" onPress={finish} />
        ) : null}
      </View>
    </View>
  );
}
