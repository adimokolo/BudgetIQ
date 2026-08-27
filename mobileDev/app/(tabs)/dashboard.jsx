import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import Svg, { Circle } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

function StatCard({ label, value, valueColor, badge, footer }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={[styles.cardValue, { color: valueColor || "#111827" }]}>
        {value}
      </Text>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {footer && <Text style={styles.cardFooter}>{footer}</Text>}
    </View>
  );
}

function Donut({ segments, size = 160, strokeWidth = 24 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let offsetAccumulator = 0;

  return (
    <Svg width={size} height={size}>
      {segments.map((seg, i) => {
        const fraction = seg.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const rotation = (offsetAccumulator / total) * 360 - 90;
        offsetAccumulator += seg.value;

        return (
          <Circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="butt"
            fill="none"
            rotation={rotation}
            origin={`${size / 2}, ${size / 2}`}
          />
        );
      })}
    </Svg>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const userName = "Adim";

  const categorySegments = [
    { label: "Savings", value: 30000, color: "#2DD4BF" },
    { label: "Food", value: 22000, color: "#7C6FF0" },
    { label: "Transport", value: 15000, color: "#F472B6" },
    { label: "Bills", value: 18000, color: "#FBBF24" },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person" size={32} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.heading}>Good to see you, {userName}</Text>
            <Text style={styles.subheading}>
              Here's the clearest picture of your money this month.
            </Text>
          </View>
        </View>

        {/* Stat cards — stacked on mobile instead of a 4-col row */}
        <View style={styles.cardsWrap}>
          <StatCard
            label="TOTAL INCOME (MONTH)"
            value="₦300,000.00"
            valueColor="#16A34A"
          />
          <StatCard
            label="TOTAL EXPENSE (MONTH)"
            value="₦55,000.00"
            valueColor="#EC4899"
          />
          <StatCard
            label="NET BALANCE"
            value="₦245,000.00"
            badge="81.67% savings rate"
          />
          <StatCard
            label="NEXT MONTH'S FORECAST"
            value="₦55,000.00"
            badge="Holding steady"
            footer="Building confidence — estimated from your last few months of spending. More history sharpens the forecast."
          />
        </View>

        {/* Income vs spending */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Income vs. spending</Text>
          <Text style={styles.sectionSubtitle}>Last six months</Text>
          <LineChart
            data={{
              labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
              datasets: [
                {
                  data: [12000, 18000, 15000, 22000, 19000, 30000],
                  color: () => "#2DD4BF",
                  strokeWidth: 2,
                },
                {
                  data: [8000, 9000, 7000, 10000, 8500, 5500],
                  color: () => "#EC4899",
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 72}
            height={200}
            withInnerLines={false}
            withOuterLines={false}
            bezier
            chartConfig={{
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: () => "#9CA3AF",
              labelColor: () => "#9CA3AF",
              propsForDots: { r: "3" },
            }}
            style={{ marginLeft: -16 }}
          />
        </View>

        {/* Where it went */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Where it went</Text>
          <Text style={styles.sectionSubtitle}>
            This month's spending by category
          </Text>
          <View style={styles.donutRow}>
            <Donut segments={categorySegments} />
          </View>
          <View style={styles.legend}>
            {categorySegments.map((seg) => (
              <View key={seg.label} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View
                    style={[styles.legendDot, { backgroundColor: seg.color }]}
                  />
                  <Text style={styles.legendLabel}>{seg.label}</Text>
                </View>
                <Text style={styles.legendValue}>
                  ₦{seg.value.toLocaleString()}.00
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  subheading: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerText: {
    flex: 1,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#111827",
  },

  cardsWrap: { gap: 12, marginBottom: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardValue: { fontSize: 22, fontWeight: "800" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ECFDF5",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  cardFooter: { fontSize: 11, color: "#9CA3AF", marginTop: 8, lineHeight: 16 },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F3",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  sectionSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
    marginBottom: 12,
  },

  donutRow: { alignItems: "center", marginVertical: 12 },
  legend: { marginTop: 12, gap: 10 },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: "#374151" },
  legendValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
});
